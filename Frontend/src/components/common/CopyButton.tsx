import { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  defaultText?: React.ReactNode;
  copiedText?: React.ReactNode;
  title?: string;
}

export default function CopyButton({ 
  textToCopy, 
  className = "", 
  defaultText = "Copy", 
  copiedText = "Copied!",
  title = "Copy"
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={className} title={title}>
      {copied ? copiedText : defaultText}
    </button>
  );
}
