import { useState } from 'react';

interface Permission {
  module: string;
  actions: string[];
}

const AVAILABLE_MODULES = [
  'RECRUITMENT',
  'LEAVE',
  'CLAIMS',
  'LOANS',
  'PETTY_CASH',
  'PERFORMANCE',
  'DOCUMENTS',
  'COMMUNICATION',
  'ADMIN'
];

const AVAILABLE_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'];

const PREDEFINED_ROLES = [
  {
    name: 'HR',
    permissions: [
      { module: 'RECRUITMENT', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'] },
      { module: 'LEAVE', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'CLAIMS', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'LOANS', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'DOCUMENTS', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
      { module: 'COMMUNICATION', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] }
    ]
  },
  {
    name: 'REGIONAL_MANAGER',
    permissions: [
      { module: 'RECRUITMENT', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'LEAVE', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'CLAIMS', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'LOANS', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'PERFORMANCE', actions: ['CREATE', 'READ', 'UPDATE'] }
    ]
  },
  {
    name: 'BRANCH_MANAGER',
    permissions: [
      { module: 'RECRUITMENT', actions: ['READ'] },
      { module: 'LEAVE', actions: ['READ', 'APPROVE', 'REJECT'] },
      { module: 'CLAIMS', actions: ['READ', 'APPROVE'] },
      { module: 'PERFORMANCE', actions: ['CREATE', 'READ', 'UPDATE'] }
    ]
  },
  {
    name: 'STAFF',
    permissions: [
      { module: 'RECRUITMENT', actions: ['READ', 'CREATE'] },
      { module: 'LEAVE', actions: ['CREATE', 'READ'] },
      { module: 'CLAIMS', actions: ['CREATE', 'READ'] },
      { module: 'LOANS', actions: ['CREATE', 'READ'] },
      { module: 'DOCUMENTS', actions: ['CREATE', 'READ'] }
    ]
  }
];

export default function RoleBuilder() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const loadRole = (roleName: string) => {
    const role = PREDEFINED_ROLES.find(r => r.name === roleName);
    if (role) {
      setPermissions(role.permissions);
      setSelectedRole(roleName);
      setCustomRole('');
    }
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions(prev => {
      const existingModule = prev.find(p => p.module === module);
      
      if (existingModule) {
        const hasAction = existingModule.actions.includes(action);
        if (hasAction) {
          // Remove action
          const updatedActions = existingModule.actions.filter(a => a !== action);
          if (updatedActions.length === 0) {
            // Remove module if no actions left
            return prev.filter(p => p.module !== module);
          }
          return prev.map(p => 
            p.module === module ? { ...p, actions: updatedActions } : p
          );
        } else {
          // Add action
          return prev.map(p => 
            p.module === module ? { ...p, actions: [...p.actions, action] } : p
          );
        }
      } else {
        // Add new module with action
        return [...prev, { module, actions: [action] }];
      }
    });
  };

  const hasPermission = (module: string, action: string) => {
    const modulePerms = permissions.find(p => p.module === module);
    return modulePerms?.actions.includes(action) || false;
  };

  const toggleModule = (module: string) => {
    const modulePerms = permissions.find(p => p.module === module);
    if (modulePerms) {
      // Remove module
      setPermissions(prev => prev.filter(p => p.module !== module));
    } else {
      // Add module with all actions
      setPermissions(prev => [...prev, { module, actions: [...AVAILABLE_ACTIONS] }]);
    }
  };

  const isModuleEnabled = (module: string) => {
    return permissions.some(p => p.module === module);
  };

  const saveRole = () => {
    const roleName = customRole || selectedRole;
    if (!roleName) {
      alert('Please enter a role name or select a predefined role');
      return;
    }

    console.log('Saving role:', { name: roleName, permissions });
    alert(`Role "${roleName}" configuration saved!\n\n${JSON.stringify({ name: roleName, permissions }, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Role Builder</h1>
          <p className="text-gray-600">Configure role-based permissions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h3 className="font-bold mb-4">Predefined Roles</h3>
              <div className="space-y-2">
                {PREDEFINED_ROLES.map(role => (
                  <button
                    key={role.name}
                    onClick={() => loadRole(role.name)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedRole === role.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {role.name.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Custom Role</h3>
              <input
                type="text"
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  setSelectedRole('');
                }}
                placeholder="Enter role name"
                className="w-full border rounded px-3 py-2 mb-4"
              />
              <button
                onClick={() => {
                  setPermissions([]);
                  setCustomRole('');
                  setSelectedRole('');
                }}
                className="w-full px-3 py-2 border rounded hover:bg-gray-100"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    Permissions Matrix
                    {(customRole || selectedRole) && (
                      <span className="text-blue-600 ml-2">
                        - {(customRole || selectedRole).replace('_', ' ')}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {permissions.length} modules configured
                  </p>
                </div>
                <button
                  onClick={saveRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Role
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Module
                      </th>
                      {AVAILABLE_ACTIONS.map(action => (
                        <th key={action} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {action}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {AVAILABLE_MODULES.map(module => (
                      <tr key={module} className={isModuleEnabled(module) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 font-medium">
                          {module.replace('_', ' ')}
                        </td>
                        {AVAILABLE_ACTIONS.map(action => (
                          <td key={action} className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={hasPermission(module, action)}
                              onChange={() => togglePermission(module, action)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isModuleEnabled(module)}
                            onChange={() => toggleModule(module)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Permission Summary */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Permission Summary</h3>
              {permissions.length === 0 ? (
                <p className="text-gray-500">No permissions configured</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map(perm => (
                    <div key={perm.module} className="border rounded p-3">
                      <div className="font-semibold text-sm mb-2">
                        {perm.module.replace('_', ' ')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {perm.actions.map(action => (
                          <span
                            key={action}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JSON Output */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">JSON Configuration</h3>
              <div className="bg-gray-50 rounded p-4 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      role: customRole || selectedRole || 'UNNAMED_ROLE',
                      permissions
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
