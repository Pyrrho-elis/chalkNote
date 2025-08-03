import React from "react";
import Image from "next/image";

export default function NotionRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed dark:prose-invert dark:text-slate-300">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading_1":
            return <h1 key={i}>{block.text}</h1>;

          case "heading_2":
            return <h2 key={i}>{block.text}</h2>;

          case "heading_3":
            return <h3 key={i}>{block.text}</h3>;

          case "paragraph":
            return <p key={i}>{block.text}</p>;

          case "bulleted_list_item":
            return (
              <ul key={i} className="list-disc ml-6">
                <li>{block.text}</li>
              </ul>
            );

          case "numbered_list_item":
            return (
              <ol key={i} className="list-decimal ml-6">
                <li>{block.text}</li>
              </ol>
            );

          case "quote":
            return (
              <blockquote key={i} className="border-l-4 pl-4 italic text-slate-600 bg-slate-50 p-4 rounded-r">
                {block.text}
              </blockquote>
            );

          case "code":
            return (
              <pre key={i} className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm">
                <code className={`language-${block.language}`}>{block.code}</code>
              </pre>
            );

          case "divider":
            return <hr key={i} className="my-8 border-slate-300" />;

          case "image":
            return (
              <figure key={i} className="max-w-[400px] mx-auto my-6 px-4">
                <Image
                  src={block.imageUrl}
                  alt={block.alt || "Image"}
                  width={400}
                  height={300}
                  className="rounded-xl object-contain"
                />
                {block.caption && (
                  <figcaption className="text-sm text-center text-slate-500 mt-2 italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return (
              <p key={i} className="text-sm text-red-500 italic">
                ⚠️ Unsupported block: {block.type}
              </p>
            );
        }
      })}
    </div>
  );
} 