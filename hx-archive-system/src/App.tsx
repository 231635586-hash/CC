import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, UnderConstructionPage } from '@/components/layout';
import { ArchiveListPage } from '@/features/archive/pages/ArchiveListPage';
import { ArchiveDetailPage } from '@/features/archive/pages/ArchiveDetailPage';
import { SalaryListPage } from '@/features/salary/pages/SalaryListPage';
import { SalaryDetailPage } from '@/features/salary/pages/SalaryDetailPage';
import {
  ReportWorkListPage,
  ReportWorkDetailPage,
  SupplementApplyPage,
  ApproveListPage,
  ApproveDetailPage,
} from '@/features/report-work/pages';
import {
  DepartmentPage,
  PositionPage,
  EstablishmentPage,
  DepartmentArchivePage,
  RankPage,
} from '@/features/organization/pages';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/archive" replace />} />

          {/* 组织管理 */}
          <Route path="/organization/department" element={<DepartmentPage />} />
          <Route path="/organization/position" element={<PositionPage />} />
          <Route path="/organization/headcount" element={<EstablishmentPage />} />
          <Route path="/organization/department-archive" element={<DepartmentArchivePage />} />
          <Route path="/organization/rank" element={<RankPage />} />

          {/* 员工档案 */}
          <Route path="/archive" element={<ArchiveListPage />} />
          <Route path="/archive/:id" element={<ArchiveDetailPage />} />
          <Route path="/salary" element={<SalaryListPage />} />
          <Route path="/salary/:id" element={<SalaryDetailPage />} />
          <Route path="/salary-template" element={<UnderConstructionPage title="薪资模版" />} />

          {/* 报工管理 */}
          <Route path="/report-work" element={<ReportWorkListPage />} />
          <Route path="/report-work/:id" element={<ReportWorkDetailPage />} />
          <Route path="/report-work/supplement/:date" element={<SupplementApplyPage />} />
          <Route path="/report-work/approve" element={<ApproveListPage />} />
          <Route path="/report-work/approve/:id" element={<ApproveDetailPage />} />

          {/* 系统管理 */}
          <Route path="/settings/permission" element={<UnderConstructionPage title="权限配置" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;