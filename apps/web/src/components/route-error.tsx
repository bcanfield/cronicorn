export default function RouteError({ error }: { error: Error }) {
  return (
    <article className="error">
      {error.message}
    </article>
  );
}
