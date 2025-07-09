import React from 'react';

const Loader = () => (
  <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
    <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-sky-500 mb-4"></div>
    <div className="text-white text-xl font-semibold">Processing... Please Wait</div>
  </div>
);

export default Loader; 