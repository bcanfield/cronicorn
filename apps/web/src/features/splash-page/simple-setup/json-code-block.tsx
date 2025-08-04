type JsonCodeBlockProps = {
  jsonString: string;
  className?: string;
};

export function JsonCodeBlock({ jsonString, className = "" }: JsonCodeBlockProps) {
  const formatJson = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, 2);

      return formatted.split("\n").map((line, index) => {
        // Handle different JSON elements
        let processedLine = line;

        // Property names (orange in original)
        processedLine = processedLine.replace(/"([^"]+)":/g, "<span class=\"text-amber-400\">\"$1\"</span>:");

        // String values (green in original)
        processedLine = processedLine.replace(/: "([^"]+)"/g, ": <span class=\"text-emerald-400\">\"$1\"</span>");

        // Array string values
        processedLine = processedLine.replace(/\["([^"]+)"\]/g, "[<span class=\"text-emerald-400\">\"$1\"</span>]");

        // Structural characters remain default text color
        return <div key={index} className="text-foreground" dangerouslySetInnerHTML={{ __html: processedLine }} />;
      });
    }
    catch (error) {
      return <div className="text-destructive">Invalid JSON</div>;
    }
  };

  return (
    <div className={`bg-card rounded-lg p-6 border border-border ${className}`}>
      <pre className="text-xs font-mono text-left text-wrap">
        <code>{formatJson(jsonString)}</code>
      </pre>
    </div>
  );
}
