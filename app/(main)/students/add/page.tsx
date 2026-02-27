import StudentInformationForm from "@/components/(main)/zoho-students/student-information-form";

export default function AddStudentPage() {
  return (
    <div className="mx-auto py-6 space-y-6">
      <StudentInformationForm mode="create" />
    </div>
  );
}
