import { useI18n } from '../i18n';
import { contributionRecord, type ContributionActivity } from '../contribution-record';

export default function ContributionRecordButton({
  row,
  actor,
  network,
  productionEligible,
}: {
  row: ContributionActivity;
  actor: string;
  network: unknown;
  productionEligible: unknown;
}) {
  const { m } = useI18n();
  if (!contributionRecord(row, actor, network, productionEligible, new Date().toISOString())) return null;
  const download = () => {
    const record = contributionRecord(row, actor, network, productionEligible, new Date().toISOString());
    if (!record) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `blockallisto-testnet-contribution-${record.transactionHash}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className="btn btn-ghost" onClick={download}>
      {m.account.contributionRecordDownload}
    </button>
  );
}
