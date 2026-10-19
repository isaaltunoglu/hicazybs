import { DEMO_COMPANY, isDemoModeActive } from './demoData';

export interface TenantScope {
    companyId: string;
    subTeamId: string; // 'all' veya subTeam.id
}

let currentScope: TenantScope = {
    companyId: 'default-company',
    subTeamId: 'all',
};

export function setCurrentTenantScope(scope: Partial<TenantScope>): void {
    currentScope = {
        ...currentScope,
        ...scope,
    };
}

export function getCurrentTenantScope(): TenantScope {
    if (isDemoModeActive() && (!currentScope.companyId || currentScope.companyId === 'default-company')) {
        return {
            ...currentScope,
            companyId: DEMO_COMPANY.id,
        };
    }
    return currentScope;
}

export function matchesTenantScope(
    docData: { companyId?: string; subTeamId?: string },
    companyId?: string,
    subTeamId?: string
): boolean {
    const scope = getCurrentTenantScope();
    const effectiveCompanyId = companyId || scope.companyId || 'default-company';
    const effectiveSubTeamId = subTeamId || scope.subTeamId || 'all';

    const docCompanyId = docData.companyId || 'default-company';
    if (docCompanyId !== effectiveCompanyId) {
        return false;
    }
    if (effectiveSubTeamId && effectiveSubTeamId !== 'all') {
        return (docData.subTeamId || '') === effectiveSubTeamId;
    }
    return true;
}
