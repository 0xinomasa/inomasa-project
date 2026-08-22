import type { ProductPath } from '../_shell/model';

type PathCardProps = {
  path: ProductPath;
  position: string;
};

export function PathCard({ path, position }: PathCardProps) {
  const isAvailable = path.status === 'AVAILABLE';

  return (
    <article className={`path-card path-card--${path.status.toLowerCase()}`} id={path.id}>
      <div className="path-card__topline">
        <span className="path-card__position">{position}</span>
        <span className="path-card__status">{path.status}</span>
      </div>

      <div>
        <p className="eyebrow">{path.eyebrow}</p>
        <h3>{path.label}</h3>
        <p className="path-card__summary">{path.summary}</p>
      </div>

      <div className="path-card__footer">
        <span>{path.note}</span>
        <span aria-hidden="true" className="path-card__arrow">
          {isAvailable ? '↗' : '—'}
        </span>
      </div>
    </article>
  );
}
