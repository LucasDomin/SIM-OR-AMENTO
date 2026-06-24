import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Link2,
  Send,
  XCircle,
} from 'lucide-react';
import { BudgetStatusBadge } from '../components/BudgetStatusBadge';
import { Layout } from '../components/Layout';
import { t } from '../lib/i18n';
import { formatCurrency, getSettings, supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { formatPercent, recalcBudgetSnapshot } from '../lib/calc';
import { generateProposalPDF } from '../lib/proposalPdf';
import type { Budget } from '../types';

export function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadBudget();
  }, [id]);

  async function loadBudget() {
    const { data } = await supabase.from('budgets').select().eq('id', id || '').single();
    if (data) {
      // Recalcula a partir dos valores aplicados para garantir que a tela e o PDF
      // sejam sempre idênticos (sem cache antigo / valores desatualizados).
      setBudget(recalcBudgetSnapshot(data as Budget, getSettings()) as Budget);
    } else {
      setBudget(null);
    }
    setLoading(false);
  }

  async function updateStatus(status: Budget['status']) {
    if (!budget) return;
    await supabase.from('budgets').update({ status }).eq('id', budget.id);
    loadBudget();
  }

  function duplicateBudget() {
    if (!budget) return;
    navigate('/budgets/new', { state: { duplicate: budget } });
  }

  function proposalUrl() {
    if (!budget) return '';
    return `${window.location.origin}/proposal/${budget.online_slug}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(proposalUrl());
      alert(t.linkCopied);
    } catch {
      /* clipboard bloqueado */
    }
  }

  async function generatePDF(clientOnly: boolean) {
    if (!budget) return;
    await generateProposalPDF(budget, getSettings(), clientOnly);
  }

  if (loading) {
    return (
      <Layout>
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </Layout>
    );
  }

  if (!budget) {
    return (
      <Layout>
        <p className="text-white/50">{t.notFound}</p>
      </Layout>
    );
  }

  const servicesSubtotal = budget.services.reduce((s, i) => s + i.subtotal, 0);
  const reelsSubtotal = budget.reels.reduce((s, i) => s + i.subtotal, 0);
  const equipmentSubtotal = budget.equipment.reduce((s, i) => s + i.subtotal, 0);
  const professionalsSubtotal = budget.professionals.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = budget.services.length + budget.reels.length + budget.equipment.length + budget.professionals.length;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8">
        <button
          onClick={() => navigate('/budgets')}
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
        >
          <ChevronLeft size={16} /> {t.back}
        </button>

        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">{t.budgetId} {budget.id.slice(0, 8)}</p>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="min-w-0 flex-1 break-words font-display text-3xl leading-tight text-white md:text-4xl">
                {budget.project_name}
              </h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
            <p className="mt-3 break-words text-sm text-white/45">
              {budget.client_name} · {budget.project_type} · {t.expiresOn} {formatDate(budget.expires_at)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {budget.status === 'Draft' && <ActionButton onClick={() => updateStatus('Sent')} icon={Send}>{t.send}</ActionButton>}
            {budget.status === 'Sent' && (
              <>
                <ActionButton onClick={() => updateStatus('Approved')} icon={CheckCircle2}>{t.approve}</ActionButton>
                <ActionButton onClick={() => updateStatus('Rejected')} icon={XCircle}>{t.reject}</ActionButton>
              </>
            )}
            <ActionButton onClick={duplicateBudget} icon={Copy}>{t.duplicate}</ActionButton>
          </div>
        </motion.header>

        {/* TOTAL GERAL - destaque máximo */}
        <div className="rounded-3xl border border-accent/30 bg-accent/[0.08] p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent">{t.finalPriceLabel}</p>
          <p className="font-display text-5xl text-white md:text-7xl">
            {formatCurrency(budget.final_price)}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Subtotal" value={formatCurrency(budget.cost_total)} />
            <Metric label={`Fee (${t.fee})`} value={formatCurrency(budget.fee_value)} />
            <Metric label={`Impostos (${t.tax})`} value={formatCurrency(budget.tax_value)} />
          </div>
        </div>

        {/* PROPOSTA - geração de documentos e link */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-white">{t.proposal}</h2>
            <span className="text-xs text-white/35">Gere documentos e compartilhe o link</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ProposalAction onClick={() => generatePDF(true)} icon={FileText} title={t.pdfClient} desc="Versão para o cliente" />
            <ProposalAction onClick={() => generatePDF(false)} icon={Download} title={t.pdfInternal} desc="Com custos e margem" />
            <ProposalAction onClick={copyLink} icon={Link2} title={t.copyLink} desc="Proposta online" />
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
            <Link2 size={14} className="shrink-0 text-white/30" />
            <span className="min-w-0 flex-1 truncate text-xs text-white/40" title={proposalUrl()}>
              {proposalUrl()}
            </span>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Copiar
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-5">
            <ScopeCard budget={budget} />

            <Card title={t.professionals}>
              {budget.professionals.length === 0 ? (
                <EmptyState message="Nenhum profissional adicionado" />
              ) : (
                <div className="divide-y divide-white/5">
                  {budget.professionals.map((prof) => (
                    <ItemRow
                      key={prof.id}
                      name={prof.name}
                      details={[
                        `${prof.days} ${t.days.toLowerCase()}`,
                        `Diária ${formatCurrency(prof.daily_rate)}`,
                        `Custo ${formatCurrency(prof.cost_price * prof.days)}`,
                      ]}
                      value={formatCurrency(prof.subtotal)}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title={t.equipment}>
              {budget.equipment.length === 0 ? (
                <EmptyState message="Nenhum equipamento adicionado" />
              ) : (
                <div className="divide-y divide-white/5">
                  {budget.equipment.map((item) => (
                    <ItemRow
                      key={item.id}
                      name={item.name}
                      details={[
                        `${item.days} ${t.days.toLowerCase()}`,
                        `Diária ${formatCurrency(item.daily_rate)}`,
                        item.pickup_date ? `Retirada: ${formatDate(item.pickup_date)}` : null,
                        item.return_date ? `Devolução: ${formatDate(item.return_date)}` : null,
                      ].filter(Boolean) as string[]}
                      value={formatCurrency(item.subtotal)}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title={`${t.steps.services} (${budget.services.length})`}>
              {budget.services.length === 0 ? (
                <EmptyState message="Nenhum serviço adicionado" />
              ) : (
                <div className="divide-y divide-white/5">
                  {budget.services.map((item) => (
                    <ItemRow
                      key={item.id}
                      name={item.name}
                      details={[
                        item.category,
                        `${item.quantity} × ${formatCurrency(item.unit_price)}`,
                      ]}
                      value={formatCurrency(item.subtotal)}
                    />
                  ))}
                </div>
              )}
            </Card>

            {budget.reels.length > 0 && (
              <Card title={`${t.steps.reels} (${budget.reels.length})`}>
                <div className="divide-y divide-white/5">
                  {budget.reels.map((item) => (
                    <ItemRow
                      key={item.id}
                      name={item.name}
                      details={[`${item.quantity} × ${formatCurrency(item.unit_price)}`]}
                      value={formatCurrency(item.subtotal)}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Controle interno */}
            <Card title="Controle Interno">
              <p className="text-xs text-white/40 mb-3">Valores para gestão — não aparecem na proposta do cliente.</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-1"><span>Custo total</span><span>{formatCurrency(budget.cost_total)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span>Lucro (fee)</span><span className="text-emerald-400">{formatCurrency(budget.profit)}</span></div>
                <div className="flex justify-between font-medium"><span>Margem</span><span>{formatPercent(budget.margin)}</span></div>
              </div>
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            <Card title={t.generalInfo}>
              <div className="space-y-2 text-sm">
                <InfoRow label={t.clientName} value={budget.client_name} />
                <InfoRow label={t.company} value={budget.client_company} />
                <InfoRow label={t.emailField} value={budget.client_email} />
                <InfoRow label={t.whatsapp} value={budget.client_whatsapp} />
                <InfoRow label={t.projectType} value={budget.project_type} />
              </div>
            </Card>

            <Card title={t.productionInfo}>
              <div className="space-y-2 text-sm">
                <InfoRow label={t.shootingDays} value={`${budget.production.shooting_days} ${t.days.toLowerCase()}`} />
                <InfoRow label={t.city} value={budget.production.city} />
                <InfoRow label={t.delivery} value={`${budget.production.delivery_days} ${t.days.toLowerCase()}`} />
                <InfoRow label={t.startDate} value={budget.production.start_date ? formatDate(budget.production.start_date) : '—'} />
              </div>
            </Card>

            <Card title="Resumo por seção">
              <div className="space-y-2 text-sm">
                <InfoRow label="Serviços" value={formatCurrency(servicesSubtotal)} />
                <InfoRow label="Reels" value={formatCurrency(reelsSubtotal)} />
                <InfoRow label="Equipamentos" value={formatCurrency(equipmentSubtotal)} />
                <InfoRow label="Profissionais" value={formatCurrency(professionalsSubtotal)} />
                <div className="border-t border-white/10 pt-2 mt-2">
                  <InfoRow label="Total de itens" value={String(totalItems)} />
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 font-display text-2xl text-white">{title}</h2>
      {children}
    </section>
  );
}

function ProposalAction({
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/25 hover:bg-white hover:text-black"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70 transition group-hover:bg-black/10 group-hover:text-black">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-white transition group-hover:text-black">{title}</span>
        <span className="block truncate text-xs text-white/35 transition group-hover:text-black/50">{desc}</span>
      </span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-white/35">{message}</p>;
}

function ItemRow({ name, details, value }: { name: string; details: string[]; value: string }) {
  return (
    <div className="grid items-center gap-3 py-3 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white" title={name}>{name}</p>
        <p className="truncate text-xs text-white/40">{details.join(' · ')}</p>
      </div>
      <p className="shrink-0 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-white/45">{label}</span>
      <span className="truncate text-right text-white" title={value}>{value || '—'}</span>
    </div>
  );
}

function ScopeCard({ budget }: { budget: Budget }) {
  return (
    <Card title={t.scopeLabel}>
      <p className="line-clamp-6 text-sm leading-6 text-white/55">
        {budget.project_description || 'Produção audiovisual conforme briefing acordado.'}
      </p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="truncate text-xs uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className="mt-1 break-words font-display text-xl text-white" title={value}>{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  icon: Icon,
  block,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ElementType;
  block?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:border-white/25 hover:bg-white hover:text-black ${block ? 'w-full justify-center' : ''}`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}
