import React from 'react';

const EditableDetailItem = ({ label, value, onChange }) => (
    <div className="py-3">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1">
            <input
                type="text"
                value={value || ''}
                onChange={onChange}
                className="mt-1 text-base text-slate-900 font-semibold border-b-2 border-slate-200 focus:outline-none focus:border-indigo-500 w-full"
            />
        </dd>
    </div>
);

export default EditableDetailItem; 