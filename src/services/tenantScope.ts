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
    return currentScope;
}

export function matchesTenantScope(
    docData: { companyId?: string; subTeamId?: string },
    companyId = currentScope.companyId,
    subTeamId = currentScope.subTeamId
): boolean {
    const docCompanyId = docData.companyId || 'default-company';
    if (docCompanyId !== (companyId || 'default-company')) {
        return false;
    }
    if (subTeamId && subTeamId !== 'all') {
        return (docData.subTeamId || '') === subTeamId;
    }
    return true;
}
