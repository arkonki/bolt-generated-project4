import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      className={`prose prose-sm max-w-none prose-headings:font-fantasy prose-p:font-serif ${className}`}
      components={{
        h1: ({node, ...props}) => <h1 className="text-3xl font-fantasy border-b pb-2 mb-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-2xl font-fantasy border-b pb-2 mb-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xl font-fantasy mb-2" {...props} />,
        table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
        th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
        td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-amber-500 pl-4 my-4 italic bg-amber-50 py-2 pr-4" {...props} />
        ),
        code: ({node, inline, ...props}) => 
          inline 
            ? <code className="bg-gray-100 px-1 rounded" {...props} />
            : <code className="block bg-gray-100 p-4 rounded my-4 overflow-x-auto" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
