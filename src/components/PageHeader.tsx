const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h1
      className="text-2xl font-bold tracking-tight text-slate-900"
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      {title}
    </h1>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export default PageHeader;