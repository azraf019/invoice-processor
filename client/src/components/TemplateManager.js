import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [name, setName] = useState('');
    const [fields, setFields] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            // Assumes proxy is set up or logic to handle full URL
            const res = await axios.get('/api/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch templates.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (index, value) => {
        const newFields = [...fields];
        newFields[index] = value;
        setFields(newFields);
    };

    const addField = () => {
        setFields([...fields, '']);
    };

    const removeField = (index) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanFields = fields.map(f => f.trim()).filter(f => f !== '');
        if (!name.trim() || cleanFields.length === 0) {
            setError('Template name and at least one field are required.');
            return;
        }

        try {
            await axios.post('/api/templates', {
                name: name.trim(),
                fields: cleanFields
            });
            // Reset form
            setName('');
            setFields(['']);
            fetchTemplates(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create template.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await axios.delete(`/api/templates/${id}`);
            fetchTemplates();
        } catch (err) {
            setError('Failed to delete template.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Template Manager</h2>

            {/* Creation Form */}
            <div className="mb-10 p-6 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Create New Template</h3>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., Standard Invoice"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Extraction Fields</label>
                        <p className="text-xs text-slate-500 mb-2">Define which fields the AI should extract.</p>
                        {fields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={field}
                                    onChange={(e) => handleFieldChange(index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={`Field ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    disabled={fields.length === 1}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addField}
                            className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            Add another field
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Save Template
                    </button>
                </form>
            </div>

            {/* List of Templates */}
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Existing Templates</h3>
                {loading && <p className="text-slate-500 text-sm">Loading templates...</p>}
                {!loading && templates.length === 0 && <p className="text-slate-500 text-sm">No templates found.</p>}

                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map(tpl => (
                        <div key={tpl._id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-white relative group">
                            <button
                                onClick={() => handleDelete(tpl._id)}
                                className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                title="Delete Template"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h4 className="font-bold text-slate-800">{tpl.name}</h4>
                            <p className="text-xs text-slate-400 mb-3">Created: {new Date(tpl.createdAt).toLocaleDateString()}</p>
                            <div className="flex flex-wrap gap-2">
                                {tpl.fields.map((f, i) => (
                                    <span key={i} className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TemplateManager;
