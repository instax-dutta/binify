'use client';

import { memo } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import toml from 'react-syntax-highlighter/dist/esm/languages/prism/toml';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

// Only the languages the editor actually offers are registered. The full
// Prism build ships ~300 grammars; registering just these keeps the grammar
// payload proportional to the feature set.
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('docker', docker);
SyntaxHighlighter.registerLanguage('dockerfile', docker);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('ruby', ruby);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('swift', swift);
SyntaxHighlighter.registerLanguage('toml', toml);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('yaml', yaml);

// Aliases Prism resolves to a grammar we have not registered. Rendering falls
// back to unhighlighted text rather than throwing.
const SUPPORTED = new Set([
    'bash', 'c', 'cpp', 'csharp', 'css', 'docker', 'dockerfile', 'go', 'java',
    'javascript', 'json', 'kotlin', 'markup', 'html', 'markdown', 'php',
    'python', 'ruby', 'rust', 'sql', 'swift', 'toml', 'typescript', 'yaml',
]);

export function resolveLanguage(language?: string): string | null {
    if (!language || language === 'plaintext') return null;
    const id = language.toLowerCase();
    return SUPPORTED.has(id) ? id : null;
}

const PLAIN_PROSE =
    'p-6 text-sm font-mono text-white/60 whitespace-pre-wrap break-words leading-relaxed';

interface CodeBlockProps {
    code: string;
    language?: string;
    /** Panel look: padded, inset block (used for previews and embedded code). */
    variant?: 'plain' | 'panel';
    showLineNumbers?: boolean;
}

/**
 * Syntax-highlighted code block that degrades to plain text for languages
 * outside the registered set.
 */
function CodeBlock({
    code,
    language,
    variant = 'plain',
    showLineNumbers = false,
}: CodeBlockProps) {
    const id = resolveLanguage(language);

    if (!id) {
        return <pre className={PLAIN_PROSE}>{code}</pre>;
    }

    return (
        <SyntaxHighlighter
            language={id}
            style={vscDarkPlus}
            PreTag="div"
            customStyle={
                variant === 'panel'
                    ? {
                          margin: 0,
                          padding: '1.5rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                      }
                    : {
                          margin: 0,
                          padding: variant === 'plain' ? '1.5rem' : 0,
                          background: 'transparent',
                          fontSize: '0.875rem',
                          lineHeight: '1.7',
                      }
            }
            showLineNumbers={showLineNumbers}
            lineNumberStyle={
                showLineNumbers
                    ? {
                          minWidth: '2.5em',
                          paddingRight: '1em',
                          color: 'rgba(255,255,255,0.05)',
                          textAlign: 'right',
                      }
                    : undefined
            }
        >
            {code}
        </SyntaxHighlighter>
    );
}

export default memo(CodeBlock);
