import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    OrganizationSettings,
    DEFAULT_ORG_SETTINGS,
    getOrganizationSettings,
} from '../services/organizationService';
import {
    RoleDefinition,
    DEFAULT_ROLES,
    getAllRoles,
} from '../services/roleService';
import {
    SubTeam,
    getSubTeamsByCompany,
} from '../services/companyService';
import { setCurrentTenantScope } from '../services/tenantScope';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
    orgSettings: OrganizationSettings;
    roles: RoleDefinition[];
    subTeams: SubTeam[];
    activeSubTeamId: string; // 'all' = Tüm Şirket, veya subTeam.id
    activeSubTeam: SubTeam | null;
    setActiveSubTeamId: (id: string) => void;
    loadingOrg: boolean;
    refreshOrganization: () => Promise<void>;
    refreshRoles: () => Promise<void>;
    refreshSubTeams: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
    orgSettings: DEFAULT_ORG_SETTINGS,
    roles: DEFAULT_ROLES,
    subTeams: [],
    activeSubTeamId: 'all',
    activeSubTeam: null,
    setActiveSubTeamId: () => {},
    loadingOrg: true,
    refreshOrganization: async () => {},
    refreshRoles: async () => {},
    refreshSubTeams: async () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { companyId, subTeamId } = useAuth();
    const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(DEFAULT_ORG_SETTINGS);
    const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
    const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
    const [activeSubTeamId, setActiveSubTeamIdState] = useState<string>(() => {
        try {
            return localStorage.getItem('ybs_active_sub_team_id') || 'all';
        } catch {
            return 'all';
        }
    });
    const [loadingOrg, setLoadingOrg] = useState(true);

    const setActiveSubTeamId = useCallback(
        (id: string) => {
            try {
                localStorage.setItem('ybs_active_sub_team_id', id);
            } catch {
                // ignore
            }
            setCurrentTenantScope({
                companyId: companyId || 'default-company',
                subTeamId: id,
            });
            setActiveSubTeamIdState(id);
        },
        [companyId]
    );

    // Kullanıcının atandığı bir alt takım varsa veya kayıtlı seçim varsa senkronize et
    useEffect(() => {
        const storedSubTeam = (() => {
            try {
                return localStorage.getItem('ybs_active_sub_team_id');
            } catch {
                return null;
            }
        })();
        const nextSubTeam = subTeamId || storedSubTeam || 'all';
        setCurrentTenantScope({
            companyId: companyId || 'default-company',
            subTeamId: nextSubTeam,
        });
        setActiveSubTeamIdState(nextSubTeam);
    }, [subTeamId, companyId]);

    const refreshOrganization = useCallback(async () => {
        try {
            const cfg = await getOrganizationSettings(companyId);
            setOrgSettings(cfg);
            if (cfg.organizationName) {
                document.title = cfg.organizationSubtitle
                    ? `${cfg.organizationName} • ${cfg.organizationSubtitle}`
                    : cfg.organizationName;
            }
        } catch (err) {
            console.error('Error loading organization settings:', err);
        }
    }, [companyId]);

    const refreshRoles = useCallback(async () => {
        try {
            const fetchedRoles = await getAllRoles(companyId);
            setRoles(fetchedRoles);
        } catch (err) {
            console.error('Error loading roles:', err);
        }
    }, [companyId]);

    const refreshSubTeams = useCallback(async () => {
        if (!companyId) {
            setSubTeams([]);
            return;
        }
        try {
            const list = await getSubTeamsByCompany(companyId);
            setSubTeams(list);
        } catch (err) {
            console.error('Error loading subTeams:', err);
        }
    }, [companyId]);

    useEffect(() => {
        setLoadingOrg(true);
        Promise.all([refreshOrganization(), refreshRoles(), refreshSubTeams()]).finally(() => {
            setLoadingOrg(false);
        });
    }, [refreshOrganization, refreshRoles, refreshSubTeams]);

    const activeSubTeam =
        activeSubTeamId !== 'all'
            ? subTeams.find((t) => t.id === activeSubTeamId) || null
            : null;

    return (
        <OrganizationContext.Provider
            value={{
                orgSettings,
                roles,
                subTeams,
                activeSubTeamId,
                activeSubTeam,
                setActiveSubTeamId,
                loadingOrg,
                refreshOrganization,
                refreshRoles,
                refreshSubTeams,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export default OrganizationContext;
