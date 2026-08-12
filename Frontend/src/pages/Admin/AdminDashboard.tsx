import React from 'react';
import { Link } from 'react-router';

const AdminDashboard: React.FC = () => {
  return (
    <div className="mt-0 px-2">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Users"
          value="0"
          linkText="See all users"
          linkTo="/admin/collections/users"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          smallIcon={<UsersIcon className="w-4 h-4 text-white" />}
          color="bg-[#2b7cff]"
          shadowColor="shadow-[#2b7cff]/40"
        />
        <KpiCard
          title="Blog Posts"
          value="0"
          linkText="See all blogs"
          linkTo="/admin/collections/blogs"
          icon={<BlogsIcon className="w-6 h-6 text-white" />}
          smallIcon={<BlogsIcon className="w-4 h-4 text-white" />}
          color="bg-[#00c473]"
          shadowColor="shadow-[#00c473]/40"
        />
        <KpiCard
          title="SEO Records"
          value="0"
          linkText="See all SEO"
          linkTo="/admin/collections/seo"
          icon={<SeoIcon className="w-6 h-6 text-white" />}
          smallIcon={<SeoIcon className="w-4 h-4 text-white" />}
          color="bg-[#ff6f20]"
          shadowColor="shadow-[#ff6f20]/40"
        />
        <KpiCard
          title="New Contacts"
          value="0"
          linkText="See all contacts"
          linkTo="/admin/collections/contact"
          icon={<ContactsIcon className="w-6 h-6 text-white" />}
          smallIcon={<ContactsIcon className="w-4 h-4 text-white" />}
          color="bg-[#f01479]"
          shadowColor="shadow-[#f01479]/40"
        />
        <KpiCard
          title="Media Assets"
          value="0"
          linkText="See all media"
          linkTo="/admin/collections/media"
          icon={<MediaIcon className="w-6 h-6 text-white" />}
          smallIcon={<MediaIcon className="w-4 h-4 text-white" />}
          color="bg-[#a824ff]"
          shadowColor="shadow-[#a824ff]/40"
        />
        <KpiCard
          title="Blog Topics"
          value="0"
          linkText="See all topics"
          linkTo="/admin/collections/blog-topics"
          icon={<TopicsIcon className="w-6 h-6 text-white" />}
          smallIcon={<TopicsIcon className="w-4 h-4 text-white" />}
          color="bg-[#5a67ff]"
          shadowColor="shadow-[#5a67ff]/40"
        />
        <KpiCard
          title="Categories"
          value="0"
          linkText="See all categories"
          linkTo="/admin/collections/case-study-categories"
          icon={<CategoriesIcon className="w-6 h-6 text-white" />}
          smallIcon={<CategoriesIcon className="w-4 h-4 text-white" />}
          color="bg-[#f49300]"
          shadowColor="shadow-[#f49300]/40"
        />
        <KpiCard
          title="Subscribers"
          value="0"
          linkText="See all subscribers"
          linkTo="/admin/collections/subscriber"
          icon={<SubscribersIcon className="w-6 h-6 text-white" />}
          smallIcon={<SubscribersIcon className="w-4 h-4 text-white" />}
          color="bg-[#00af91]"
          shadowColor="shadow-[#00af91]/40"
        />
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, linkText, linkTo, icon, smallIcon, color, shadowColor }: { title: string, value: string, linkText: string, linkTo: string, icon: React.ReactNode, smallIcon: React.ReactNode, color: string, shadowColor: string }) => (
  <div className="flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
    <div className="p-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-black uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black shadow-sm [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
      </div>
      <h4 className="text-3xl font-bold text-black tracking-tight">{value}</h4>
    </div>
    
    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-xl mt-auto">
      <Link to={linkTo} className="flex items-center text-xs font-bold text-black hover:opacity-75 transition-opacity group">
        {linkText}
        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </Link>
    </div>
  </div>
);

// Icons
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function BlogsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function SeoIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function ContactsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function MediaIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function TopicsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function CategoriesIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function SubscribersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}

export default AdminDashboard;
