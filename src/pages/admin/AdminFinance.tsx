
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, Filter, Search } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function AdminFinance() {
    const [loading, setLoading] = useState(true);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [stats, setStats] = useState({
        pendingWithdrawals: 0,
        totalPaid: 0,
        totalPrizes: 0,
        balance: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [wRes, hRes, pRes] = await Promise.all([
                apiService.getAdminWithdrawals(),
                apiService.getAdminFinanceHistory(),
                apiService.getAdminPrizes()
            ]);

            if (wRes.ok) setWithdrawals(wRes.data || []);
            if (hRes.ok) setHistory(hRes.data || []);
            if (pRes.ok) setPrizes(pRes.data || []);

            // Mock stats for now
            setStats({
                pendingWithdrawals: (wRes.data || []).filter((w: any) => w.status === 'pending').length,
                totalPaid: (hRes.data || []).reduce((acc: number, h: any) => acc + (h.amount || 0), 0),
                totalPrizes: (pRes.data || []).length,
                balance: 25480.50
            });
        } catch (error) {
            console.error('Error loading finance data:', error);
            toast({ title: 'Erro', description: 'Não foi possível carregar os dados financeiros.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveWithdrawal = async (id: string) => {
        try {
            const res = await apiService.updateWithdrawalStatus(parseInt(id), 'completed');
            if (res.ok) {
                toast({ title: 'Sucesso!', description: 'Saque aprovado.' });
                loadData();
            }
        } catch (error) {
            toast({ title: 'Erro', description: 'Erro ao aprovar saque.', variant: 'destructive' });
        }
    };

    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const withdrawalColumns = [
        { key: 'created_at', label: 'Data', render: (w: any) => new Date(w.created_at).toLocaleDateString('pt-BR') },
        { key: 'user_name', label: 'Solicitante' },
        { key: 'type', label: 'Tipo', render: (w: any) => <Badge variant="outline">{w.user_type === 'manager' ? 'Gerente' : 'Estabelecimento'}</Badge> },
        { key: 'amount', label: 'Valor', render: (w: any) => <span className="font-bold text-foreground">{formatCurrency(w.amount)}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (w: any) => (
                <Badge variant={w.status === 'completed' ? 'default' : 'secondary'}>
                    {w.status === 'completed' ? 'Pago' : 'Pendente'}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: 'Ações',
            render: (w: any) => w.status === 'pending' && (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApproveWithdrawal(w.id)}>Aprovar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive">Recusar</Button>
                </div>
            )
        }
    ];

    const historyColumns = [
        { key: 'created_at', label: 'Data', render: (h: any) => new Date(h.created_at).toLocaleDateString('pt-BR') },
        { key: 'description', label: 'Descrição' },
        { key: 'amount', label: 'Valor', render: (h: any) => <span className={h.amount < 0 ? 'text-destructive' : 'text-success'}>{formatCurrency(h.amount)}</span> },
    ];

    const prizeColumns = [
        { key: 'draw_date', label: 'Data do Sorteio', render: (p: any) => new Date(p.created_at).toLocaleDateString('pt-BR') },
        { key: 'winner_name', label: 'Ganhador' },
        { key: 'ticket_number', label: 'Cartela', render: (p: any) => <code className="bg-muted px-2 py-1 rounded">#{p.ticket_number}</code> },
        { key: 'prize_amount', label: 'Prêmio', render: (p: any) => <span className="font-bold text-primary">{formatCurrency(p.prize_amount)}</span> },
        {
            key: 'status',
            label: 'Status',
            render: (p: any) => (
                <Badge variant={p.withdrawn ? 'default' : 'secondary'}>
                    {p.withdrawn ? 'Resgatado' : 'Pendente'}
                </Badge>
            )
        }
    ];

    return (
        <DashboardLayout userType="admin" userName="Administrador">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Financeiro</h2>
                        <p className="text-muted-foreground">Gestão de saques, premiações e fluxo de caixa</p>
                    </div>
                    <Button variant="outline" onClick={loadData}>Atualizar</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Saldo em Conta" value={formatCurrency(stats.balance)} icon={Wallet} className="bg-primary/5 border-primary/20" />
                    <StatCard title="Saques Pendentes" value={stats.pendingWithdrawals} icon={Clock} />
                    <StatCard title="Total Pago" value={formatCurrency(stats.totalPaid)} icon={ArrowUpRight} />
                    <StatCard title="Prêmios Ganhos" value={stats.totalPrizes} icon={CheckCircle2} />
                </div>

                <Tabs defaultValue="withdrawals" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="withdrawals">Saques Pendentes</TabsTrigger>
                        <TabsTrigger value="history">Histórico Geral</TabsTrigger>
                        <TabsTrigger value="prizes">Premiações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="withdrawals">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Solicitações de Saque</CardTitle>
                                <div className="flex gap-2">
                                    <Input placeholder="Buscar..." className="w-64 h-9" />
                                    <Button size="sm" variant="outline"><Filter className="w-4 h-4 mr-2" />Filtros</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable data={withdrawals} columns={withdrawalColumns} emptyMessage="Nenhum saque pendente." />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Histórico de Transações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable data={history} columns={historyColumns} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="prizes">
                        <Card>
                            <CardHeader>
                                <CardTitle>Relatório de Premiações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataTable data={prizes} columns={prizeColumns} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
