import { Stack } from 'expo-router';

export default function RecordAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* ─── Subject input ────────────────────────────────────── */}
      <Stack.Screen name="SubjectInput" />
      <Stack.Screen name="FacultySubjectInput" />
      <Stack.Screen name="chairSubjectInput" />

      {/* ─── Evaluation forms ─────────────────────────────────── */}
      <Stack.Screen name="FacultyForm" />
      <Stack.Screen name="SupervisorForm" />
      <Stack.Screen name="FacultyEvaluationForm" />
      <Stack.Screen name="SupervisorEvaluationForm" />

      {/* ─── Post-evaluation ──────────────────────────────────── */}
      <Stack.Screen name="Submitted" />

      {/* ─── Legacy screens (pending retirement) ─────────────── */}
      <Stack.Screen name="EvaluationDetails" />
      <Stack.Screen name="EvaluationSubjects" />
      <Stack.Screen name="instructorEvaluation" />
      <Stack.Screen name="Semesters" />

      {/* ─── Faculty results drill-down (PC views Faculty) ───── */}
      <Stack.Screen name="FacultySchoolYear" />
      <Stack.Screen name="FacultyDepartments" />
      <Stack.Screen name="FacultySemesters" />
      <Stack.Screen name="FacultySubjects" />
      <Stack.Screen name="FacultyEvaluationResults" />

      {/* ─── Chair results drill-down (Supervisor views PC) ──── */}
      <Stack.Screen name="ChairSchoolYear" />
      <Stack.Screen name="chairDepartments" />
      <Stack.Screen name="chairSemesters" />
      <Stack.Screen name="chairSubjects" />
      <Stack.Screen name="chairEvaluationResults" />

      {/* ─── Faculty tabulation flow (PC views Faculty) ──────── */}
      <Stack.Screen name="FacultyTabulationSchoolYears" />
      <Stack.Screen name="FacultyTabulationSemesters" />
      <Stack.Screen name="FacultyTabulationResults" />

      {/* ─── Chair tabulation flow (Supervisor views PC) ─────── */}
      <Stack.Screen name="ChairTabulationSchoolYears" />
      <Stack.Screen name="ChairTabulationSemesters" />
      <Stack.Screen name="ChairTabulationResults" />

    </Stack>
  );
}