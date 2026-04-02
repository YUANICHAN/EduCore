import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './Components/Auth/ProtectedRoute'
import Homepage from './Pages/Home/Homepage.jsx'
import Features from './Pages/Home/Features.jsx'
import About from './Pages/Home/About.jsx'
import Contact from './Pages/Home/Contact.jsx'
import Dashboard from './Pages/Admin/Dashboard.jsx'
import UserAdmin from './Pages/Admin/UserAdmin.jsx'
import UserAll from './Pages/Admin/AllUsers.jsx'
import StudentAccounts from './Pages/Admin/StudentAccounts.jsx'
import TeacherAccounts from './Pages/Admin/TeacherAccounts.jsx'
import Students from './Pages/Admin/Students.jsx'
import UnassignedStudents from './Pages/Admin/UnassignedStudents.jsx'
import StudentsList from './Pages/Admin/StudentsList.jsx'
import Teachers from './Pages/Admin/Teachers.jsx'
import TeachersList from './Pages/Admin/TeachersList.jsx'
import Programs from './Pages/Admin/Programs.jsx'
import Departments from './Pages/Admin/Departments.jsx'
import Subjects from './Pages/Admin/Subjects.jsx'
import Section from './Pages/Admin/Section.jsx'
import AcademicYear from './Pages/Admin/AcademicYear.jsx'
import Reports from './Pages/Admin/Reports.jsx'
import Settings from './Pages/Admin/Settings.jsx'
import Enrollment from './Pages/Admin/Enrollment.jsx'
import TeacherWorkload from './Pages/Admin/TeacherWorkload.jsx'
import TeacherDashboard from './Pages/Teacher/Dashboard.jsx'
import MyClasses from './Pages/Teacher/MyClasses.jsx'
import ClassDetail from './Pages/Teacher/ClassDetail.jsx'
import TeacherSubjects from './Pages/Teacher/Subjects.jsx'
import SubjectDetail from './Pages/Teacher/SubjectDetail.jsx'
import TeacherGradebook from './Pages/Teacher/Gradebook.jsx'
import TeacherAttendance from './Pages/Teacher/Attendance.jsx'
import TeacherStudents from './Pages/Teacher/Students.jsx'
import TeacherReports from './Pages/Teacher/Reports.jsx'
import TeacherAnnouncements from './Pages/Teacher/Announcements.jsx'
import TeacherSchedule from './Pages/Teacher/Schedule.jsx'
import TeacherProfileSettings from './Pages/Teacher/ProfileSettings.jsx'
import StudentDashboard from './Pages/Student/Dashboard.jsx'
import StudentMyProfile from './Pages/Student/MyProfile.jsx'
import StudentSubjects from './Pages/Student/Subjects.jsx'
import StudentSchedule from './Pages/Student/Schedule.jsx'
import StudentAttendance from './Pages/Student/Attendance.jsx'
import StudentGrades from './Pages/Student/Grades.jsx'
import StudentAnnouncements from './Pages/Student/Announcements.jsx'
import StudentReports from './Pages/Student/Reports.jsx'
import StudentSettings from './Pages/Student/Settings.jsx'

function App() {

  return (
    <>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Homepage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Admin Routes - Protected, Admin Only */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserAdmin />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/all" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserAll />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/student-accounts" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentAccounts />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/teacher-accounts" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeacherAccounts />
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Students />
            </ProtectedRoute>
          } />
          <Route path="/admin/students/assigned" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Students />
            </ProtectedRoute>
          } />
          <Route path="/admin/students/unassigned" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UnassignedStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin/students/list" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentsList />
            </ProtectedRoute>
          } />
          <Route path="/admin/teachers/list" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeachersList />
            </ProtectedRoute>
          } />
          <Route path="/admin/teachers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Teachers />
            </ProtectedRoute>
          } />
          <Route path="/admin/programs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Programs />
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Departments />
            </ProtectedRoute>
          } />
          <Route path="/admin/subjects" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Subjects />
            </ProtectedRoute>
          } />
          <Route path="/admin/sections" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Section />
            </ProtectedRoute>
          } />
          <Route path="/admin/academic-year" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AcademicYear />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin/enrollment" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Enrollment />
            </ProtectedRoute>
          } />
          <Route path="/admin/teacher-workload" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeacherWorkload />
            </ProtectedRoute>
          } />

          {/* Teacher Routes - Protected, Teacher Only */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/teacher/classes" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MyClasses />
            </ProtectedRoute>
          } />
          <Route path="/teacher/class/:classId" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ClassDetail />
            </ProtectedRoute>
          } />
          <Route path="/teacher/subjects" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherSubjects />
            </ProtectedRoute>
          } />
          <Route path="/teacher/subject/:subjectId" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <SubjectDetail />
            </ProtectedRoute>
          } />
          <Route path="/teacher/gradebook" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherGradebook />
            </ProtectedRoute>
          } />
          <Route path="/teacher/attendance" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAttendance />
            </ProtectedRoute>
          } />
          <Route path="/teacher/students" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherStudents />
            </ProtectedRoute>
          } />
          <Route path="/teacher/reports" element={   
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherReports />
            </ProtectedRoute>
          } />
          <Route path="/teacher/announcements" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAnnouncements />
            </ProtectedRoute>
          } />
          <Route path="/teacher/schedule" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherSchedule />
            </ProtectedRoute>
          } />
          <Route path="/teacher/profile-settings" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherProfileSettings />
            </ProtectedRoute>
          } />

          {/* Student Routes - Protected, Student Only */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMyProfile />
            </ProtectedRoute>
          } />
          <Route path="/student/subjects" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSubjects />
            </ProtectedRoute>
          } />
          <Route path="/student/schedule" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSchedule />
            </ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAttendance />
            </ProtectedRoute>
          } />
          <Route path="/student/grades" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentGrades />
            </ProtectedRoute>
          } />
          <Route path="/student/announcements" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAnnouncements />
            </ProtectedRoute>
          } />
          <Route path="/student/reports" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentReports />
            </ProtectedRoute>
          } />
          <Route path="/student/settings" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSettings />
            </ProtectedRoute>
          } />

          {/* Redirect /login to homepage with login modal */}
          <Route path="/login" element={<Navigate to="/" state={{ showLoginModal: true }} replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
