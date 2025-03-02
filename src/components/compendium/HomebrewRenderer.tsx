import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface HomebrewRendererProps {
  content: string;
  preview?: boolean;
  className?: string;
}

export function HomebrewRenderer({ content, preview, className = '' }: HomebrewRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      className={`homebrew ${preview ? 'preview' : ''} ${className}`}
      components={{
        // Headers with fantasy styling
        h1: ({node, ...props}) => (
          <h1 className="text-3xl font-fantasy border-b-2 border-amber-900/20 pb-2 mb-4" {...props} />
        ),
        h2: ({node, ...props}) => (
          <h2 className="text-2xl font-fantasy border-b border-amber-900/20 pb-2 mb-3" {...props} />
        ),
        h3: ({node, ...props}) => (
          <h3 className="text-xl font-fantasy mb-2" {...props} />
        ),
        
        // Stat blocks
        table: ({node, ...props}) => (
          <div className="my-4 p-3 bg-amber-50/50 rounded-lg border border-amber-900/20">
            <table className="w-full" {...props} />
          </div>
        ),
        th: ({node, ...props}) => (
          <th className="px-2 py-1 text-left font-fantasy text-amber-900" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="px-2 py-1 border-t border-amber-900/10" {...props} />
        ),
        
        // Descriptive text
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-amber-900/20 pl-4 my-4 italic bg-amber-50/30 py-2 pr-4" {...props} />
        ),
        
        // Notes and callouts
        code: ({node, inline, ...props}) => 
          inline 
            ? <code className="px-1 bg-amber-100/50 rounded font-mono text-amber-900" {...props} />
            : (
              <div className="my-4 p-4 bg-amber-50/50 rounded-lg border border-amber-900/20">
                <code className="block font-mono text-amber-900" {...props} />
              </div>
            ),
        
        // Lists with custom bullets
        ul: ({node, ...props}) => (
          <ul className="list-none pl-5 space-y-2" {...props} />
        ),
        li: ({node, ...props}) => (
          <li className="relative before:content-['•'] before:absolute before:left-[-1em] before:text-amber-900/60" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
