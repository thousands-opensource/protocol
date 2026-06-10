import { urlFor } from '@/sanity.client'
import { PortableText } from '@portabletext/react'

interface PortableTextRendererProps {
    content: any[]
}

export default function PortableTextRenderer({ content }: PortableTextRendererProps) {
    const components = {
        types: {
            image: ({ value }: any) => (
                <div className="my-6">
                    <img
                        src={urlFor(value).width(800).height(400).url()}
                        alt={value.alt || 'Image'}
                        className="w-full h-auto rounded-lg"
                    />
                    {value.caption && (
                        <p className="text-sm text-gray-600 mt-2 text-center italic">
                            {value.caption}
                        </p>
                    )}
                </div>
            ),
        },
        marks: {
            link: ({ children, value }: any) => (
                <a
                    href={value.href}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            ),
        },
        block: {
            h1: ({ children }: any) => (
                <h1 className="text-3xl font-bold my-4">{children}</h1>
            ),
            h2: ({ children }: any) => (
                <h2 className="text-2xl font-semibold my-3">{children}</h2>
            ),
            h3: ({ children }: any) => (
                <h3 className="text-xl font-medium my-2">{children}</h3>
            ),
            blockquote: ({ children }: any) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
                    {children}
                </blockquote>
            ),
            normal: ({ children }: any) => (
                <p className="mb-4 leading-relaxed">{children}</p>
            ),
        },
        list: {
            bullet: ({ children }: any) => (
                <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>
            ),
            number: ({ children }: any) => (
                <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>
            ),
        },
        listItem: {
            bullet: ({ children }: any) => <li>{children}</li>,
            number: ({ children }: any) => <li>{children}</li>,
        },
    }

    return (
        <div className="prose prose-lg max-w-none">
            <PortableText value={content} components={components} />
        </div>
    )
}