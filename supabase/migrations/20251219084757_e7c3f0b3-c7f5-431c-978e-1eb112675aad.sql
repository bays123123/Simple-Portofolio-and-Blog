-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  read_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Create index for published posts
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published) WHERE published = true;

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can read published posts)
CREATE POLICY "Anyone can read published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (published = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, published, read_time) VALUES
(
  'Getting Started with React and TypeScript',
  'getting-started-react-typescript',
  'A comprehensive guide to setting up your first React project with TypeScript. Learn the basics and best practices for building type-safe applications.',
  'React and TypeScript are a powerful combination for building modern web applications. TypeScript adds static typing to JavaScript, which helps catch errors early in the development process and improves code maintainability.

## Why TypeScript?

TypeScript provides several benefits:
- **Type Safety**: Catch errors at compile time rather than runtime
- **Better IDE Support**: Enhanced autocomplete and refactoring tools
- **Improved Documentation**: Types serve as inline documentation
- **Easier Refactoring**: Changes are validated across the codebase

## Setting Up Your Project

To create a new React + TypeScript project, you can use Vite:

```bash
npm create vite@latest my-app -- --template react-ts
```

This will set up a modern React project with TypeScript support out of the box.',
  true,
  '5 min read'
),
(
  'My Journey into Software Engineering',
  'journey-into-software-engineering',
  'Reflecting on my path from curious kid to software engineering student. The challenges, lessons learned, and what keeps me motivated.',
  'Everyone''s journey into technology is unique. Mine started with curiosity about how things work and evolved into a passion for creating solutions through code.

## The Beginning

It all started when I first encountered a computer. The ability to create something from nothing - just by typing commands - was magical to me.

## Challenges Along the Way

Learning to code isn''t always easy. There were times when bugs seemed impossible to fix and concepts felt too complex to understand. But persistence paid off.

## What Keeps Me Going

The satisfaction of solving problems and building things that help people is what drives me forward. Every project teaches something new.',
  true,
  '8 min read'
),
(
  'Why I Chose Tailwind CSS Over Traditional CSS',
  'tailwind-css-over-traditional',
  'Exploring the benefits of utility-first CSS and how Tailwind CSS has changed my approach to styling web applications.',
  'Tailwind CSS has revolutionized how I approach styling web applications. The utility-first approach might seem verbose at first, but the benefits are substantial.

## Utility-First Benefits

- **No Context Switching**: Style directly in your markup
- **Consistent Design**: Built-in design system with spacing, colors, and typography
- **Smaller CSS Bundles**: Only includes styles you actually use
- **Rapid Prototyping**: Build interfaces faster than ever

## The Learning Curve

At first, the class names seemed overwhelming. But after a few days of use, muscle memory kicks in and development speed increases dramatically.

## Conclusion

Tailwind CSS has become an essential tool in my development workflow. The consistency and speed it provides are unmatched.',
  true,
  '4 min read'
),
(
  'Exploring the World of Open Source',
  'exploring-open-source',
  'My experience contributing to open source projects and why every developer should consider giving back to the community.',
  'Open source software powers much of the internet we use every day. Contributing to open source is not only rewarding but also an excellent way to grow as a developer.

## Getting Started

Finding your first project to contribute to can be daunting. Look for projects with good documentation and welcoming communities.

## My First Contribution

My first open source contribution was a small documentation fix. It might seem insignificant, but it opened the door to larger contributions.

## Benefits of Contributing

- Learn from experienced developers
- Build your portfolio
- Network with other developers
- Give back to tools you use daily

Contributing to open source has been one of the most valuable experiences in my development journey.',
  true,
  '6 min read'
);