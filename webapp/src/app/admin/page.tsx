import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/DashboardCharts";

export default async function AdminDashboardPage() {
  const totalCables = await prisma.cableModel.count();
  const approvedCables = await prisma.cableModel.count({ where: { status: "APPROVED" } });
  const pendingCables = await prisma.cableModel.count({ where: { status: "PENDING" } });
  const totalMaterials = await prisma.material.count();
  const totalRules = await prisma.standardRule.count();

  // Fetch some distribution data for charts
  const materialDist = await prisma.material.groupBy({
    by: ['category'],
    _count: { category: true }
  });

  const statusDist = [
    { name: 'Approved', value: approvedCables },
    { name: 'Pending', value: pendingCables },
    { name: 'Other', value: totalCables - approvedCables - pendingCables }
  ];

  const chartData = {
    statusDist,
    materialDist: materialDist.map(m => ({ name: m.category, value: m._count.category }))
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
        Dashboard <span className="text-gradient">Overview</span>
      </h1>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total SKUs</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{totalCables}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Approved</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{approvedCables}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Approval</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{pendingCables}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Master Materials</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{totalMaterials}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>SKU Status Distribution</h2>
          <DashboardCharts type="pie" data={chartData.statusDist} />
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Materials by Category</h2>
          <DashboardCharts type="bar" data={chartData.materialDist} />
        </div>
      </div>
    </div>
  );
}
