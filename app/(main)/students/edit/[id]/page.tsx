import StudentInformationForm from "@/components/(main)/zoho-students/student-information-form";

export default function EditStudentPage() {
  return (
    <div className="mx-auto py-6 space-y-4">
      <StudentInformationForm mode="edit" />
    </div>
  );
}
