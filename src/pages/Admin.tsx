import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, LogOut, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published: boolean;
  read_time: string | null;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState<'title' | 'excerpt' | 'content' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    published: false,
    read_time: '',
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (post: typeof formData) => {
      const { error } = await supabase.from('blog_posts').insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || null,
        content: post.content,
        cover_image: post.cover_image || null,
        published: post.published,
        read_time: post.read_time || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      resetForm();
      toast({ title: 'Artikel berhasil dibuat' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal membuat artikel', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, post }: { id: string; post: typeof formData }) => {
      const { error } = await supabase.from('blog_posts').update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || null,
        content: post.content,
        cover_image: post.cover_image || null,
        published: post.published,
        read_time: post.read_time || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      resetForm();
      toast({ title: 'Artikel berhasil diperbarui' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal memperbarui artikel', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Artikel berhasil dihapus' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Gagal menghapus artikel', description: error.message });
    },
  });

  const resetForm = () => {
    setIsEditing(false);
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      published: false,
      read_time: '',
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      cover_image: post.cover_image || '',
      published: post.published,
      read_time: post.read_time || '',
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      toast({ variant: 'destructive', title: 'Judul, slug, dan konten wajib diisi' });
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, post: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateAIContent = async (type: 'title' | 'excerpt' | 'content') => {
    const topic = aiTopic || formData.title;
    if (!topic) {
      toast({ variant: 'destructive', title: 'Masukkan topik atau judul terlebih dahulu' });
      return;
    }

    setIsGenerating(type);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { topic, type }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const content = data.content;

      if (type === 'title') {
        const cleanTitle = content.replace(/^["']|["']$/g, '').trim();
        setFormData(prev => ({ 
          ...prev, 
          title: cleanTitle,
          slug: generateSlug(cleanTitle)
        }));
      } else if (type === 'excerpt') {
        setFormData(prev => ({ ...prev, excerpt: content.trim() }));
      } else {
        setFormData(prev => ({ ...prev, content: content.trim() }));
      }

      toast({ title: `${type === 'title' ? 'Judul' : type === 'excerpt' ? 'Ringkasan' : 'Konten'} berhasil di-generate` });
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({ variant: 'destructive', title: 'Gagal generate konten', description: error.message });
    } finally {
      setIsGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki akses admin. Hubungi administrator untuk mendapatkan akses.
            </p>
            <Button onClick={handleLogout} variant="outline">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingPost ? 'Edit Artikel' : 'Artikel Baru'}
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* AI Topic Input */}
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles size={16} />
                    AI Content Generator
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Masukkan topik untuk generate konten..."
                      className="bg-background"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => generateAIContent('title')}
                        disabled={isGenerating !== null}
                      >
                        {isGenerating === 'title' ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                        Generate Judul
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => generateAIContent('excerpt')}
                        disabled={isGenerating !== null}
                      >
                        {isGenerating === 'excerpt' ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                        Generate Ringkasan
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => generateAIContent('content')}
                        disabled={isGenerating !== null}
                      >
                        {isGenerating === 'content' ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                        Generate Konten
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({ 
                        ...formData, 
                        title,
                        slug: editingPost ? formData.slug : generateSlug(title)
                      });
                    }}
                    placeholder="Judul artikel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-artikel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Ringkasan</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Ringkasan singkat artikel"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Konten (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Konten artikel dalam format Markdown"
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image">Cover Image URL</Label>
                  <Input
                    id="cover_image"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="read_time">Waktu Baca</Label>
                  <Input
                    id="read_time"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                    placeholder="5 min read"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                  <Label htmlFor="published">Publikasikan</Label>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPost ? 'Perbarui Artikel' : 'Buat Artikel'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Posts List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Artikel</CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : posts?.length === 0 ? (
                <p className="text-muted-foreground">Belum ada artikel</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {posts?.map((post) => (
                    <div
                      key={post.id}
                      className="p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{post.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(post.created_at), 'dd MMM yyyy')}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${post.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(post)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(post.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
