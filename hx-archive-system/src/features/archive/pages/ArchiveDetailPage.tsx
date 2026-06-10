import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody, Tab, Button, Badge, Input, Select } from '@/components/ui';
import { InfoGrid } from '@/components/data';
import { ImagePreview, BankCardNumber } from '@/components/ui/ImagePreview';
import { useArchiveStore } from '@/store';
import { fetchArchiveDetail } from '@/services/api';
import { formatDate, maskPhone, maskIdCard } from '@/lib/utils';
import { ArrowLeftIcon, DownloadIcon, PrinterIcon, EditIcon, SaveIcon, XIcon, HistoryIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { ContractList, ContractDetailDrawer } from '../components';

// 模拟当前用户角色（实际应从 authStore 获取）
const currentUser = { name: 'HR管理员', role: 'hr_admin' as const };
const isHRorAdmin = currentUser.role === 'hr_admin' || currentUser.role === 'system_admin';

// 可编辑的Tab列表
const EDITABLE_TABS = ['entry', 'basic', 'materials'] as const;
type EditableTab = typeof EDITABLE_TABS[number];

export function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDetail, activeTab, setCurrentDetail, setActiveTab, editMode, setEditMode, editLogs, addEditLog } = useArchiveStore();

  // 临时编辑数据
  const [tempEmployee, setTempEmployee] = useState(currentDetail?.employee || null);

  // 编辑日志弹窗
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArchiveDetail(id).then((detail) => {
        setCurrentDetail(detail);
        setTempEmployee(detail?.employee || null);
      });
    }
  }, [id, setCurrentDetail]);

  useEffect(() => {
    // 每次进入页面重置Tab到入职信息
    return () => {
      setActiveTab('entry');
      // 关闭所有编辑模式
      EDITABLE_TABS.forEach(tab => setEditMode(tab, false));
    };
  }, [id, setActiveTab]);

  // 同步 tempEmployee 当 currentDetail 变化时
  useEffect(() => {
    if (currentDetail?.employee) {
      setTempEmployee(currentDetail.employee);
    }
  }, [currentDetail]);

  const handleSave = (tab: EditableTab) => {
    if (!tempEmployee) return;

    // 记录操作日志
    addEditLog({
      operator: currentUser.name,
      operateType: '修改',
      operateModule: tab === 'entry' ? '入职信息' : tab === 'basic' ? '基本信息' : '个人材料',
      changedFields: `修改了 ${tab === 'entry' ? '入职信息' : tab === 'basic' ? '基本信息' : '个人材料'} 模块的字段`,
      changeReason: '',
    });

    //关闭编辑模式
    setEditMode(tab, false);

    // TODO: 调用API保存数据到后端
    console.log('保存数据:', tempEmployee);
  };

  const handleCancel = (tab: EditableTab) => {
    // 恢复原始数据
    setTempEmployee(currentDetail?.employee || null);
    setEditMode(tab, false);
  };

  const handleEditClick = (tab: EditableTab) => {
    setEditMode(tab, true);
  };

  // 判断当前Tab是否可编辑
  const isEditable = (tabKey: string): tabKey is EditableTab => EDITABLE_TABS.includes(tabKey as EditableTab);

  // 渲染编辑按钮
  const renderEditButton = (tabKey: string) => {
    if (!isEditable(tabKey)) return null;
    if (!isHRorAdmin) return null;

    const tab = tabKey as EditableTab;
    const isEditing = editMode[tab];

    return (
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={<SaveIcon className="w-4 h-4" />}
              onClick={() => handleSave(tab)}
            >
              保存
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<XIcon className="w-4 h-4" />}
              onClick={() => handleCancel(tab)}
            >
              取消
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<EditIcon className="w-4 h-4" />}
            onClick={() => handleEditClick(tab)}
          >
            编辑
          </Button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      fetchArchiveDetail(id).then((detail) => {
        setCurrentDetail(detail);
      });
    }
  }, [id, setCurrentDetail]);

  useEffect(() => {
    // 每次进入页面重置Tab到入职信息
    return () => {
      setActiveTab('entry');
    };
  }, [id, setActiveTab]);

  if (!currentDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    );
  }

  const { employee, personalMaterials, probation, transfers, resignations, approvalRecords, contracts } = currentDetail;

  // 计算工龄
  const calculateWorkYears = (firstJobDate?: string) => {
    if (!firstJobDate) return '-';
    const start = new Date(firstJobDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${years}年`;
  };

  // 入职信息Tab
  const entryInfoContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>入职基本信息</CardTitle>
            {renderEditButton('entry')}
          </div>
        </CardHeader>
        <CardBody>
         <InfoGrid
            items={[
              { label: '工号', value: editMode.entry ? (
                <Input value={tempEmployee?.employeeNo || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, employeeNo: e.target.value } : null)} />
              ) : employee.employeeNo },
              { label: '姓名', value: editMode.entry ? (
                <Input value={tempEmployee?.name || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, name: e.target.value } : null)} />
              ) : employee.name },
              { label: '性别', value: editMode.entry ? (
                <Select value={tempEmployee?.gender || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, gender: e.target.value as any } : null)} options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
              ) : employee.gender },
              { label: '手机号', value: editMode.entry ? (
                <Input value={tempEmployee?.phone || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)} />
              ) : maskPhone(employee.phone) },
              { label: '身份证号', value: maskIdCard(employee.idCard) },
              { label: '出生日期', value: formatDate(employee.birthDate) },
              { label: '学历', value: editMode.entry ? (
                <Select value={tempEmployee?.education || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, education: e.target.value as any } : null)} options={[{ value: '高中', label: '高中' }, { value: '大专', label: '大专' }, { value: '本科', label: '本科' }, { value: '硕士', label: '硕士' }, { value: '博士', label: '博士' }]} />
              ) : employee.education },
              { label: '籍贯', value: editMode.entry ? (
                <Input value={tempEmployee?.hometown || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, hometown: e.target.value } : null)} />
              ) : employee.hometown || '-' },
              { label: '入职日期', value: formatDate(employee.entryDate) },
              { label: '所属部门', value: employee.departmentName },
              { label: '岗位', value: employee.positionName },
              { label: '职级', value: editMode.entry ? (
                <Input value={tempEmployee?.rankLevel || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, rankLevel: e.target.value } : null)} />
              ) : employee.rankLevel || '-' },
              { label: '员工类型', value: editMode.entry ? (
                <Select value={tempEmployee?.employeeType || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, employeeType: e.target.value as any } : null)} options={[{ value: '校招生', label: '校招生' }, { value: '社招生', label: '社招生' }, { value: '内推', label: '内推' }, { value: '猎头', label: '猎头' }, { value: '实习生', label: '实习生' }, { value: '外包', label: '外包' }]} />
              ) : employee.employeeType || '-' },
              { label: '招聘来源', value: editMode.entry ? (
                <Input value={tempEmployee?.recruitSource || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, recruitSource: e.target.value as any } : null)} />
              ) : employee.recruitSource || '-' },
              { label: '合同类型', value: employee.contractType },
              { label: '合同期限', value: editMode.entry ? (
                <Input value={tempEmployee?.contractPeriod || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, contractPeriod: e.target.value } : null)} />
              ) : employee.contractPeriod || '-' },
              { label: '试用期时长', value: employee.probationDuration ? `${employee.probationDuration}个月` : '-' },
              { label: '试用期薪资', value: employee.probationSalary ? `¥${employee.probationSalary.toLocaleString()}` : '-' },
              { label: '转正薪资', value: employee.formalSalary ? `¥${employee.formalSalary.toLocaleString()}` : '-' },
              { label: '档案状态', value: <StatusBadge status={employee.status} /> },
            ]}
            columns={3}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>紧急联系 & 银行卡信息</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '紧急联系人', value: editMode.entry ? (
                <Input value={tempEmployee?.emergencyContact || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, emergencyContact: e.target.value } : null)} />
              ) : employee.emergencyContact || '-' },
              { label: '银行卡号', value: employee.bankCardNo ? maskIdCard(employee.bankCardNo) : '-' },
              { label: '银行名称', value: editMode.entry ? (
                <Input value={tempEmployee?.bankName || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, bankName: e.target.value } : null)} />
              ) : employee.bankName || '-' },
              { label: '开户行', value: editMode.entry ? (
                <Input value={tempEmployee?.bankBranch || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, bankBranch: e.target.value } : null)} />
              ) : employee.bankBranch || '-' },
              { label: '银行卡号', value: <BankCardNumber bankCardNumber={employee.bankCardNumber} /> },
            ]}
            columns={3}
          />
        </CardBody>
      </Card>

      {employee.signature && (
        <Card>
          <CardHeader>
            <CardTitle>电子签名</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg">
              <p className="text-lg font-serif text-[var(--color-text-primary)]">{employee.signature}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );

  // 基本信息Tab
  const basicInfoContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>个人信息</CardTitle>
            {renderEditButton('basic')}
          </div>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '婚姻状况', value: editMode.basic ? (
                <Select value={tempEmployee?.maritalStatus || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, maritalStatus: e.target.value as any } : null)} options={[{ value: '未婚', label: '未婚' }, { value: '已婚', label: '已婚' }, { value: '离异', label: '离异' }, { value: '丧偶', label: '丧偶' }]} />
              ) : employee.maritalStatus || '-' },
              { label: '身份证开始日期', value: employee.idCardStartDate ? formatDate(employee.idCardStartDate) : '-' },
              { label: '身份证截止日期', value: employee.idCardEndDate ? formatDate(employee.idCardEndDate) : '-' },
              { label: '首次参加工作时间', value: employee.firstJobDate ? formatDate(employee.firstJobDate) : '-' },
              { label: '工龄', value: calculateWorkYears(employee.firstJobDate) },
              { label: '户籍类型', value: editMode.basic ? (
                <Select value={tempEmployee?.householdType || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, householdType: e.target.value as any } : null)} options={[{ value: '农业', label: '农业' }, { value: '非农业', label: '非农业' }, { value: '其他', label: '其他' }]} />
              ) : employee.householdType || '-' },
              { label: '政治面貌', value: editMode.basic ? (
                <Select value={tempEmployee?.politicalStatus || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, politicalStatus: e.target.value as any } : null)} options={[{ value: '群众', label: '群众' }, { value: '共青团员', label: '共青团员' }, { value: '中共党员', label: '中共党员' }, { value: '中共预备党员', label: '中共预备党员' }]} />
              ) : employee.politicalStatus || '-' },
              { label: '是否退役军人', value: editMode.basic ? (
                <Select value={employee.isVeteran ? '是' : '否'} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, isVeteran: e.target.value === '是' } : null)} options={[{ value: '是', label: '是' }, { value: '否', label: '否' }]} />
              ) : employee.isVeteran ? '是' : '否' },
              { label: '血型', value: editMode.basic ? (
                <Select value={tempEmployee?.bloodType || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, bloodType: e.target.value as any } : null)} options={[{ value: 'A型', label: 'A型' }, { value: 'B型', label: 'B型' }, { value: 'AB型', label: 'AB型' }, { value: 'O型', label: 'O型' }, { value: '其他', label: '其他' }]} />
              ) : employee.bloodType || '-' },
              { label: '身高', value: editMode.basic ? (
                <Input value={tempEmployee?.height || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, height: Number(e.target.value) } : null)} type="number" />
              ) : employee.height ? `${employee.height}cm` : '-' },
              { label: '体重', value: editMode.basic ? (
                <Input value={tempEmployee?.weight || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, weight: Number(e.target.value) } : null)} type="number" />
              ) : employee.weight ? `${employee.weight}kg` : '-' },
            ]}
            columns={3}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>社保公积金</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '个人社保账号', value: editMode.basic ? (
                <Input value={tempEmployee?.socialSecurityNo || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, socialSecurityNo: e.target.value } : null)} />
              ) : employee.socialSecurityNo || '-' },
              { label: '个人公积金账号', value: editMode.basic ? (
                <Input value={tempEmployee?.housingFundNo || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, housingFundNo: e.target.value } : null)} />
              ) : employee.housingFundNo || '-' },
            ]}
            columns={2}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>地址 & 户口</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '住址', value: editMode.basic ? (
                <Input value={tempEmployee?.address || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, address: e.target.value } : null)} />
              ) : employee.address || '-' },
              { label: '户口所在地', value: editMode.basic ? (
                <Input value={tempEmployee?.householdAddress || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, householdAddress: e.target.value } : null)} />
              ) : employee.householdAddress || '-' },
            ]}
            columns={1}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>家庭关系</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '是否有亲属关系', value: editMode.basic ? (
                <Select value={employee.hasRelative ? '是' : '否'} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, hasRelative: e.target.value === '是' } : null)} options={[{ value: '是', label: '是' }, { value: '否', label: '否' }]} />
              ) : employee.hasRelative ? '是' : '否' },
              { label: '亲属姓名', value: editMode.basic ? (
                <Input value={tempEmployee?.relativeName || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, relativeName: e.target.value } : null)} />
              ) : employee.relativeName || '-' },
              { label: '亲属所在部门', value: editMode.basic ? (
                <Input value={tempEmployee?.relativeDepartment || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, relativeDepartment: e.target.value } : null)} />
              ) : employee.relativeDepartment || '-' },
            ]}
            columns={3}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>教育背景</CardTitle>
        </CardHeader>
        <CardBody>
          <InfoGrid
            items={[
              { label: '毕业学校', value: editMode.basic ? (
                <Input value={tempEmployee?.graduateSchool || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, graduateSchool: e.target.value } : null)} />
              ) : employee.graduateSchool || '-' },
              { label: '所学专业', value: editMode.basic ? (
                <Input value={tempEmployee?.major || ''} onChange={(e) => setTempEmployee(prev => prev ? { ...prev, major: e.target.value } : null)} />
              ) : employee.major || '-' },
              { label: '毕业时间', value: employee.graduateDate ? formatDate(employee.graduateDate) : '-' },
            ]}
            columns={3}
          />
        </CardBody>
      </Card>
    </div>
  );

  // 个人材料Tab
  const personalMaterialsContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>证件照片</CardTitle>
            {renderEditButton('materials')}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">身份证（正面）</p>
              <ImagePreview src={personalMaterials?.idCardFront} alt="身份证正面" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">身份证（反面）</p>
              <ImagePreview src={personalMaterials?.idCardBack} alt="身份证反面" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学历 & 证书</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">学历证书</p>
              <ImagePreview src={personalMaterials?.educationCert} alt="学历证书" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">学位证书</p>
              <ImagePreview src={personalMaterials?.degreeCert} alt="学位证书" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">前公司离职证明</p>
              <ImagePreview src={personalMaterials?.previousCompanyCert} alt="离职证明" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>员工照片 & 银行卡</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">员工照片</p>
              <ImagePreview src={personalMaterials?.employeePhoto} alt="员工照片" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">银行卡照片</p>
              <ImagePreview src={personalMaterials?.bankCardPhoto} alt="银行卡" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>技能 & 从业证书</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">人员技能证书</p>
              <ImagePreview src={personalMaterials?.skillCert} alt="技能证书" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">退役军人证</p>
              <ImagePreview src={personalMaterials?.veteranCert} alt="退役军人证" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">残疾人证</p>
              <ImagePreview src={personalMaterials?.disabilityCert} alt="残疾人证" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">相关从业资格证</p>
              <ImagePreview src={personalMaterials?.professionalCert} alt="从业资格证" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // 转正记录Tab
  const probationContent = probation ? (
    <Card>
      <CardHeader>
        <CardTitle>转正记录</CardTitle>
      </CardHeader>
      <CardBody>
        <InfoGrid
          items={[
            { label: '申请日期', value: formatDate(probation.applyDate) },
            { label: '转正日期', value: formatDate(probation.probationEndDate) },
            { label: '转正状态', value: <StatusBadge status={probation.status} /> },
            { label: '试用期总结', value: probation.summary, span: 3 },
            { label: '部门负责人评价', value: probation.leaderReview, span: 3 },
            { label: 'HR审核意见', value: probation.hrReview, span: 3 },
          ]}
          columns={3}
        />
      </CardBody>
    </Card>
  ) : (
    <Card>
      <CardBody>
        <p className="text-center text-[var(--color-text-disabled)] py-8">暂无转正记录</p>
      </CardBody>
    </Card>
  );

  // 异动记录Tab
  const transferContent = transfers && transfers.length > 0 ? (
    <div className="space-y-4">
      {transfers.map((record, index) => (
        <Card key={record.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>异动记录 {index + 1}</CardTitle>
              <Badge variant={record.transferType === '晋升' ? 'success' : record.transferType === '降职' ? 'danger' : 'info'}>
                {record.transferType}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <InfoGrid
              items={[
                { label: '异动日期', value: formatDate(record.transferDate) },
                { label: '生效日期', value: record.effectiveDate ? formatDate(record.effectiveDate) : '-' },
                { label: '异动类型', value: record.transferType },
                { label: '原部门', value: record.fromDepartmentName },
                { label: '新部门', value: record.toDepartmentName },
                { label: '原岗位', value: record.fromPositionName },
                { label: '新岗位', value: record.toPositionName },
                { label: '原职级', value: record.fromRankLevel || '-' },
                { label: '新职级', value: record.toRankLevel || '-' },
                { label: '异动原因', value: record.reason, span: 3 },
                { label: '审批结论', value: record.approvalConclusion, span: 3 },
              ]}
              columns={3}
            />
          </CardBody>
        </Card>
      ))}
    </div>
  ) : (
    <Card>
      <CardBody>
        <p className="text-center text-[var(--color-text-disabled)] py-8">暂无异动记录</p>
      </CardBody>
    </Card>
  );

  // 离职记录Tab
  const resignationContent = resignations && resignations.length > 0 ? (
    <div className="space-y-4">
      {resignations.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>离职记录</CardTitle>
              <Badge variant={record.resignationType === '主动离职' ? 'info' : record.resignationType === '被动离职' ? 'danger' : 'neutral'}>
                {record.resignationType}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <InfoGrid
              items={[
                { label: '离职日期', value: formatDate(record.resignationDate) },
                { label: '最后工作日', value: record.lastWorkingDate ? formatDate(record.lastWorkingDate) : '-' },
                { label: '提交申请日期', value: formatDate(record.applyDate) },
                { label: '离职原因', value: record.reason || '-', span: 3 },
                { label: '部门负责人审批', value: record.leaderApproval === 'approved' ? '已通过' : record.leaderApproval === 'rejected' ? '已驳回' : '待审批' },
                { label: '部门审批时间', value: record.leaderApprovalDate ? formatDate(record.leaderApprovalDate) : '-' },
                { label: 'HR审批', value: record.hrApproval === 'approved' ? '已通过' : record.hrApproval === 'rejected' ? '已驳回' : '待审批' },
                { label: 'HR审批时间', value: record.hrApprovalDate ? formatDate(record.hrApprovalDate) : '-' },
                { label: '财务审批', value: record.financeApproval === 'approved' ? '已通过' : record.financeApproval === 'rejected' ? '已驳回' : '待审批' },
                { label: '财务审批时间', value: record.financeApprovalDate ? formatDate(record.financeApprovalDate) : '-' },
                { label: '工作交接人', value: record.handoverPerson || '-' },
                { label: '交接日期', value: record.handoverDate ? formatDate(record.handoverDate) : '-' },
                { label: '工作交接确认', value: record.handoverConfirmation, span: 3 },
                { label: '离职证明', value: record.certificateOfEmployment ? (
                  <ImagePreview src={record.certificateOfEmployment} alt="离职证明" />
                ) : '-' },
                { label: '合同终止日期', value: formatDate(record.contractEndDate) },
                { label: '档案状态', value: <StatusBadge status={record.status} /> },
              ]}
              columns={3}
            />
          </CardBody>
        </Card>
      ))}
    </div>
  ) : (
    <Card>
      <CardBody>
        <p className="text-center text-[var(--color-text-disabled)] py-8">暂无离职记录</p>
      </CardBody>
    </Card>
  );

  // 审批记录Tab
  const approvalContent = approvalRecords && approvalRecords.length > 0 ? (
    <div className="space-y-4">
      {approvalRecords.map((record) => (
        <Card key={record.id}>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 text-center">
                <p className="text-xs text-[var(--color-text-disabled)]">流程类型</p>
                <Badge variant="brand" size="sm">{record.flowName}</Badge>
              </div>
              <div className="flex-shrink-0 w-32">
                <p className="text-xs text-[var(--color-text-disabled)]">节点名称</p>
                <p className="text-sm font-medium">{record.nodeName}</p>
              </div>
              <div className="flex-shrink-0 w-24">
                <p className="text-xs text-[var(--color-text-disabled)]">审批人</p>
                <p className="text-sm">{record.approverName}</p>
                <p className="text-xs text-[var(--color-text-disabled)]">{record.approverRole}</p>
              </div>
              <div className="flex-shrink-0 w-24">
                <p className="text-xs text-[var(--color-text-disabled)]">审批时间</p>
                <p className="text-sm">{record.approveDate ? formatDate(record.approveDate) : '-'}</p>
              </div>
              <div className="flex-shrink-0 w-24">
                <p className="text-xs text-[var(--color-text-disabled)]">审批状态</p>
                <Badge variant={
                  record.status === 'approved' ? 'success' :
                  record.status === 'rejected' ? 'danger' : 'warning'
                } size="sm">
                  {record.status === 'approved' ? '已通过' : record.status === 'rejected' ? '已驳回' : '待审批'}
                </Badge>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-text-disabled)]">审批意见</p>
                <p className="text-sm">{record.comment || '-'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  ) : (
    <Card>
      <CardBody>
        <p className="text-center text-[var(--color-text-disabled)] py-8">暂无审批记录</p>
      </CardBody>
    </Card>
  );

  // 合同记录Tab
  const contractContent = (
    <div className="px-4">
      <ContractList contracts={contracts || []} />
    </div>
  );

  const tabItems = [
    { key: 'entry', label: '入职信息', content: entryInfoContent },
    { key: 'basic', label: '基本信息', content: basicInfoContent },
    { key: 'materials', label: '个人材料', content: personalMaterialsContent },
    { key: 'probation', label: '转正记录', content: probationContent },
    { key: 'transfer', label: '异动记录', content: transferContent },
    { key: 'resignation', label: '离职记录', content: resignationContent },
    { key: 'approval', label: '审批记录', content: approvalContent },
    { key: 'contract', label: '合同记录', content: contractContent },
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
            onClick={() => navigate('/archive')}
          />
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {employee.name} - 档案详情
          </h1>
          <StatusBadge status={employee.status} />
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
        <CardBody>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] flex items-center justify-center text-xl font-semibold">
              {employee.name.charAt(0)}
            </div>
            <div className="grid grid-cols-4 gap-x-8 gap-y-2 flex-1">
              <div>
                <p className="text-xs text-[var(--color-text-disabled)] mb-1">工号</p>
                <p className="text-sm font-medium">{employee.employeeNo}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-disabled)] mb-1">部门</p>
                <p className="text-sm font-medium">{employee.departmentName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-disabled)] mb-1">岗位</p>
                <p className="text-sm font-medium">{employee.positionName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-disabled)] mb-1">入职日期</p>
                <p className="text-sm font-medium">{formatDate(employee.entryDate)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tab切换 */}
      <Card>
        <CardBody className="p-0">
          <Tab
            items={tabItems}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as typeof activeTab)}
          />
        </CardBody>
      </Card>

      {/* 合同详情抽屉 */}
      <ContractDetailDrawer />

      {/* 操作日志抽屉 */}
      {showLogDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>档案编辑操作日志</CardTitle>
                <Button variant="ghost" size="sm" icon={<XIcon className="w-4 h-4" />} onClick={() => setShowLogDrawer(false)} />
              </div>
            </CardHeader>
            <CardBody className="overflow-auto">
              {editLogs.length === 0 ? (
                <p className="text-center text-[var(--color-text-disabled)] py-8">暂无操作日志</p>
              ) : (
                <div className="space-y-4">
                  {editLogs.map((log) => (
                    <div key={log.id} className="border-b border-[var(--color-border)] pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <Badge variant={log.operateType === '新增' ? 'success' : log.operateType === '修改' ? 'info' : 'danger'}>
                          {log.operateType}
                        </Badge>
                        <span className="text-sm font-medium">{log.operateModule}</span>
                        <span className="text-xs text-[var(--color-text-disabled)]">{log.operateTime}</span>
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        <p>操作人：{log.operator}</p>
                        <p>变更字段：{log.changedFields}</p>
                        {log.changeReason && <p>变更原因：{log.changeReason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* 操作日志入口 */}
      {editLogs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            variant="primary"
            size="sm"
            icon={<HistoryIcon className="w-4 h-4" />}
            onClick={() => setShowLogDrawer(true)}
          >
            查看操作日志 ({editLogs.length})
          </Button>
        </div>
      )}
    </div>
  );
}