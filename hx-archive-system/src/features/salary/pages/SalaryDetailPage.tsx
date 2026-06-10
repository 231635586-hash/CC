import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody, StatusBadge, Button } from '@/components/ui';
import { InfoGrid } from '@/components/data';
import { useSalaryStore } from '@/store';
import { fetchSalaryDetail } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeftIcon, DownloadIcon, PrinterIcon } from 'lucide-react';

export function SalaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPayroll, setCurrentPayroll } = useSalaryStore();

  useEffect(() => {
    if (id) {
      fetchSalaryDetail(id).then((payroll) => {
        setCurrentPayroll(payroll);
      });
    }
  }, [id, setCurrentPayroll]);

  if (!currentPayroll) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  const payroll = currentPayroll;

  // 基本信息
  const baseInfoItems = [
    { label: '工资条编号', value: `YGZ-${payroll.issueMonth.replace('-', '')}-${payroll.id.slice(-4)}` },
    { label: '员工姓名', value: payroll.employeeName },
    { label: '所属部门', value: payroll.departmentName },
    { label: '发放月份', value: payroll.issueMonth },
    { label: '发放状态', value: <StatusBadge status={payroll.issueStatus} /> },
  ];

  // 应发项目
  const earningsItems = [
    { label: '基本工资', value: formatCurrency(payroll.baseSalary) },
    { label: '岗位津贴', value: formatCurrency(payroll.positionAllowance) },
    { label: '绩效奖金', value: formatCurrency(payroll.performanceBonus) },
    { label: '加班工资', value: formatCurrency(payroll.overtimePay) },
    { label: '其他补贴', value: formatCurrency(payroll.otherAllowances) },
    {
      label: '应发合计',
      value: (
        <span className="font-semibold text-status-success">
          {formatCurrency(payroll.grossSalary)}
        </span>
      ),
    },
  ];

  // 扣款项
  const deductionsItems = [
    { label: '养老保险', value: formatCurrency(payroll.pensionInsurance) },
    { label: '医疗保险', value: formatCurrency(payroll.medicalInsurance) },
    { label: '失业保险', value: formatCurrency(payroll.unemploymentInsurance) },
    { label: '公积金', value: formatCurrency(payroll.housingFund) },
    { label: '个人所得税', value: formatCurrency(payroll.personalIncomeTax) },
    {
      label: '扣款合计',
      value: (
        <span className="font-semibold text-status-danger">
          {formatCurrency(payroll.totalDeductions)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="w-4 h-4" />}
            onClick={() => navigate('/salary')}
          />
          <h1 className="text-xl font-semibold text-text-primary">
            工资条详情 - {payroll.employeeName}
          </h1>
          <StatusBadge status={payroll.issueStatus} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<PrinterIcon className="w-4 h-4" />}>
            打印
          </Button>
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
            导出
          </Button>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid items={baseInfoItems} columns={5} />
        </CardBody>
      </Card>

      {/* 薪资明细 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 应发项目 */}
        <Card>
          <CardHeader>
            <CardTitle>应发项目</CardTitle>
          </CardHeader>
          <CardBody>
            <InfoGrid items={earningsItems} columns={2} />
          </CardBody>
        </Card>

        {/* 扣款项 */}
        <Card>
          <CardHeader>
            <CardTitle>扣款项</CardTitle>
          </CardHeader>
          <CardBody>
            <InfoGrid items={deductionsItems} columns={2} />
          </CardBody>
        </Card>
      </div>

      {/* 实发工资 */}
      <Card className="border-2 border-status-success">
        <CardBody className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-text-primary">实发工资</span>
            <span className="text-xs text-text-disabled">(扣除社保公积金及个税后)</span>
          </div>
          <div className="text-2xl font-bold text-status-success">
            {formatCurrency(payroll.netSalary)}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}