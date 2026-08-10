import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function ActivityLog() {
  return (
    <div>
      <PageMeta
        title="Activity Log | Waflow"
        description="Activity Log page for Waflow"
      />
      <PageBreadcrumb pageTitle="Activity Log" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Activity Log Content Goes Here
          </p>
        </div>
      </div>
    </div>
  );
}
