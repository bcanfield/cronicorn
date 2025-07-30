const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </header>
  );
};
export default PageHeader;
