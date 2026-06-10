// ========================================
// 人员档案类型定义
// ========================================

export type Gender = '男' | '女';
export type Education = '高中' | '大专' | '本科' | '硕士' | '博士' | '本科在读';
export type ContractType = '全职' | '兼职' | '实习';
export type EmployeeStatus = 'active' | 'archived';
export type ProbationStatus = 'passed' | 'rejected' | 'extended';
export type TransferType = '调岗' | '晋升' | '降职';
export type ResignationType = '主动离职' | '被动离职' | '退休';
export type ApprovalStatus = 'approved' | 'rejected' | 'pending';
export type MaritalStatus = '未婚' | '已婚' | '离异' | '丧偶';
export type HouseholdType = '农业' | '非农业' | '其他';
export type PoliticalStatus = '群众' | '共青团员' | '中共党员' | '中共预备党员' | '民革会员' | '民盟盟员' | '其他';
export type BloodType = 'A型' | 'B型' | 'AB型' | 'O型' | '其他';
export type EmployeeType = '校招生' | '社招生' | '内推' | '猎头' | '实习生' | '外包';
export type RecruitSource = 'BOSS直聘' | '智联招聘' | '前程无忧' | '猎聘' | '猎头' | '内推' | '校招' | '其他';

// 合同相关类型
export type LaborContractType = '劳动合同' | '实习协议' | '劳务合同' | '竞业协议' | '其他';
export type ContractStatus = 'draft' | 'pending_sign' | 'active' | 'expiring_soon' | 'terminated' | 'renewing';
export type ChangeType = 'new' | 'renew' | 'change' | 'terminate';
export type SignStatus = 'unsigned' | 'employer_signed' | 'both_signed';

export interface Contract {
  id: string;
  employeeId: string;
  contractNo: string; // 格式：HT-YYYYMM-序号
  contractType: LaborContractType;
  employerCompany: string; // 甲方（公司）
  employeeName: string; // 乙方（员工）
  signDate: string; // 签订日期
  startDate: string; // 合同起始日期
  endDate: string; // 合同截止日期
  status: ContractStatus;
  renewalCount: number; // 续签次数
  relatedTransferId?: string; // 关联异动记录ID
  remarks?: string; // 备注
}

export interface ContractChange {
  id: string;
  contractId: string;
  changeDate: string;
  changeType: ChangeType;
  changeReason?: string;
  relatedTransferId?: string; // 关联异动记录ID
  changeContent?: string; // 变更内容
  newContractId?: string; // 变更后新合同ID（如有新签）
  operator: string;
  operateTime: string;
}

export interface ContractAttachment {
  id: string;
  contractId: string;
  contractScan?: string; // 合同扫描件
  employerSignature?: string; // 甲方签章
  employeeSignature?: string; // 乙方签章（电子手写签名）
  signStatus: SignStatus;
  signTime?: string; // 签章时间
}

export interface ContractDetail {
  contract: Contract;
  changes: ContractChange[];
  attachment?: ContractAttachment;
}

export interface Employee {
  // 基本信息
  id: string;
  employeeNo: string;
  name: string;
  gender: Gender;
  phone: string;
  idCard: string;
  birthDate: string;
  education: Education;
  hometown?: string;
  emergencyContact?: string;
  bankCardNo?: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  rankLevel?: string; // 职级
  entryDate: string;
  probationDuration?: number;
  contractType: ContractType;
  contractPeriod?: string;
  status: EmployeeStatus;

  // 入职补充信息
  employeeType?: EmployeeType; // 员工类型
  recruitSource?: RecruitSource; // 招聘来源
  probationSalary?: number; // 试用期薪资
  formalSalary?: number; // 转正薪资
  signature?: string; // 手写签名（电子签）

  // 基本信息Tab
  maritalStatus?: MaritalStatus; // 婚姻状况
  idCardStartDate?: string; // 身份证开始日期
  idCardEndDate?: string; // 身份证截止日期
  firstJobDate?: string; // 首次参加工作时间
  householdType?: HouseholdType; // 户籍类型
  address?: string; // 住址
  politicalStatus?: PoliticalStatus; // 政治面貌
  socialSecurityNo?: string; // 个人社保账号
  housingFundNo?: string; // 个人公积金账号
  householdAddress?: string; // 户口所在地
  isVeteran?: boolean; // 是否退役军人
  height?: number; // 身高(cm)
  weight?: number; // 体重(kg)
  bloodType?: BloodType; // 血型
  hasRelative?: boolean; // 是否有亲属关系
  relativeName?: string; // 亲属姓名
  relativeDepartment?: string; // 亲属所在部门
  graduateSchool?: string; // 毕业学校
  graduateDate?: string; // 毕业时间
  major?: string; // 所学专业

  // 银行卡信息
  bankName?: string; // 银行名称
  bankBranch?: string; // 开户行
  bankCardNumber?: string; // 银行卡号
}

export interface PersonalMaterial {
  id: string;
  employeeId: string;
  idCardFront?: string; // 身份证正面
  idCardBack?: string; // 身份证反面
  educationCert?: string; // 学历证书
  degreeCert?: string; // 学位证书
  previousCompanyCert?: string; // 前公司离职证明
  employeePhoto?: string; // 员工照片
  bankCardPhoto?: string; // 银行卡号照片
  skillCert?: string; // 人员技能证书
  veteranCert?: string; // 退役军人证
  disabilityCert?: string; // 残疾人证
  professionalCert?: string; // 相关从业资格证
}

export interface ProbationRecord {
  id: string;
  employeeId: string;
  applyDate: string;
  summary?: string;
  leaderReview?: string;
  hrReview?: string;
  probationEndDate: string;
  status: ProbationStatus;
}

export interface TransferRecord {
  id: string;
  employeeId: string;
  transferDate: string;
  effectiveDate?: string; // 生效日期
  transferType: TransferType;
  fromDepartmentId: string;
  fromDepartmentName: string;
  fromPositionId: string;
  fromPositionName: string;
  fromRankLevel?: string; // 原职级
  toDepartmentId: string;
  toDepartmentName: string;
  toPositionId: string;
  toPositionName: string;
  toRankLevel?: string; // 新职级
  reason?: string;
  approvalConclusion?: string;
}

export interface ApprovalRecord {
  id: string;
  employeeId: string;
  flowType: 'probation' | 'transfer' | 'resignation' | 'salary_adjust';
  flowName: string; // 流程名称
  nodeName: string; // 节点名称
  approverName: string; // 审批人
  approverRole: string; // 审批人角色
  approveDate?: string; // 审批时间
  status: ApprovalStatus;
  comment?: string; // 审批意见
}

export interface ResignationRecord {
  id: string;
  employeeId: string;
  resignationDate: string;
  resignationType: ResignationType;
  applyDate: string;
  lastWorkingDate?: string; // 最后工作日
  leaderApproval?: ApprovalStatus;
  leaderApprovalDate?: string;
  hrApproval?: ApprovalStatus;
  hrApprovalDate?: string;
  financeApproval?: ApprovalStatus;
  financeApprovalDate?: string;
  handoverConfirmation?: string;
  handoverPerson?: string; // 交接人
  handoverDate?: string; // 交接日期
  certificateOfEmployment?: string;
  contractEndDate: string;
  reason?: string; // 离职原因
  status: EmployeeStatus;
}

export interface ArchiveDetail {
  employee: Employee;
  personalMaterials?: PersonalMaterial;
  probation?: ProbationRecord;
  transfers: TransferRecord[];
  resignations: ResignationRecord[];
  approvalRecords: ApprovalRecord[];
  contracts: ContractDetail[]; // 合同记录
}