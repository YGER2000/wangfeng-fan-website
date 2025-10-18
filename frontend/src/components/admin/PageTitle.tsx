import { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  rightActions?: ReactNode;
}

const PageTitle = ({ title, rightActions }: PageTitleProps) => {
  return (
    <div className="relative mt-2 mb-6">
      <h1 className="text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-wangfeng-purple via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
        {title}
      </h1>
      {rightActions && (
        <div className="absolute top-0 right-0">{rightActions}</div>
      )}
    </div>
  );
};

export default PageTitle;


