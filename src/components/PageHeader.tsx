const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h1
      className="text-2xl"
      style={{ fontFamily: "Playfair Display, serif", color: "#0B3D2E" }}
    >
      {title}
    </h1>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default PageHeader;