import React from 'react';
import { useProjects } from '../hooks/useProjects';

interface ProjectListProps {
  constituencyId: number;
}

const ProjectList: React.FC<ProjectListProps> = ({ constituencyId }) => {
  const { projects, isLoading, error, refetch } = useProjects(constituencyId);

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Projects for Constituency {constituencyId}</h2>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.project_id}>
              <strong>{project.project_name}</strong> - Status: {project.status} (Budget: K{project.budget.toLocaleString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectList;
