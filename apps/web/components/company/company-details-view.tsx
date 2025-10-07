'use client';

import React from 'react';
import { Company, CompanyUser, COMPANY_STATUSES } from '@/types/company';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@starter/ui';
import { Building2, Mail, Calendar, AlertCircle, CheckCircle, Clock, Users, User, Shield, Crown, UserCog, Briefcase } from 'lucide-react';

interface CompanyDetailsViewProps {
  company: Company;
  canEdit?: boolean;
  onEditClick?: () => void;
}

export function CompanyDetailsView({ 
  company, 
  canEdit = false, 
  onEditClick 
}: CompanyDetailsViewProps) {
  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'trial':
        return <Clock className="w-4 h-4" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: Company['status']) => {
    const statusOption = COMPANY_STATUSES.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
      return 'Invalid Date';
    }
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getRoleIcon = (role: CompanyUser['role']) => {
    switch (role) {
      case 'system_admin':
        return <Crown className="w-4 h-4 text-purple-600" />;
      case 'company_admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'team_lead':
        return <UserCog className="w-4 h-4 text-green-600" />;
      case 'frontline_worker':
        return <Briefcase className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: CompanyUser['role']) => {
    switch (role) {
      case 'system_admin':
        return 'System Admin';
      case 'company_admin':
        return 'Company Admin';
      case 'team_lead':
        return 'Team Lead';
      case 'frontline_worker':
        return 'Frontline Worker';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: CompanyUser['role']) => {
    switch (role) {
      case 'system_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'company_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'team_lead':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'frontline_worker':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Company Information
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                View your organization&apos;s details and settings
              </p>
            </div>
          </CardTitle>
          {canEdit && onEditClick && (
            <button
              onClick={onEditClick}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50"
            >
              Edit Company
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Company Name */}
        <div className="flex items-start space-x-4">
          <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {company.name}
            </p>
          </div>
        </div>

        {/* Contact Email */}
        <div className="flex items-start space-x-4">
          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {company.contact_email}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-start space-x-4">
          <div className="mt-0.5">
            {getStatusIcon(company.status)}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(company.status)} flex items-center gap-2 w-fit`}
            >
              {getStatusIcon(company.status)}
              {getStatusLabel(company.status)}
            </Badge>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {COMPANY_STATUSES.find(s => s.value === company.status)?.description}
            </p>
          </div>
        </div>

        {/* Created Date */}
        <div className="flex items-start space-x-4">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created
            </label>
            <p className="text-base text-gray-900 dark:text-white">
              {formatDate(company.created_at)}
            </p>
          </div>
        </div>

        {/* Company Users */}
        {company.users && company.users.length > 0 && (
          <div className="flex items-start space-x-4">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Company Users ({company.userCount || company.users.length})
              </label>
              <div className="space-y-2">
                {company.users.map((user) => (
                  <div 
                    key={user._id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.has_llm_access && (
                        <Badge 
                          variant="outline" 
                          className="bg-green-100 text-green-800 border-green-200 text-xs"
                        >
                          LLM Access
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`${getRoleBadgeColor(user.role)} flex items-center gap-1`}
                      >
                        {getRoleIcon(user.role)}
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Company ID: {company._id}</p>
            <p>Record created: {formatDate(company._creationTime)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}