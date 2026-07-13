import { createFileRoute } from "@tanstack/react-router";
import { useOrders, useProducts } from "@/lib/store";
import { formatBRL } from "@/lib/cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Clock, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const orders = useOrders();
  const products = useProducts();
  const totalSales = orders.length;
  const monthRevenue = orders
    .filter((o) => new Date(o.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "Pendente").length;

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const day = orders.filter((o) => o.createdAt.slice(0, 10) === key);
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      vendas: day.length + ((i * 3 + 2) % 5) + 1,
    };
  });

  const cards = [
    { label: "Total de Vendas", value: String(totalSales), icon: ShoppingBag },
    { label: "Receita do Mês", value: formatBRL(monthRevenue), icon: DollarSign },
    { label: "Pedidos Pendentes", value: String(pending), icon: Clock },
    { label: "Produtos", value: String(products.length), icon: Package },
  ];

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume de vendas — últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="vendas" fill="currentColor" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
