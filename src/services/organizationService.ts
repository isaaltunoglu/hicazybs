import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_COMPANY, isDemoModeActive } from './demoData';

export interface OrganizationSettings {
    organizationName: string;
    organizationSubtitle: string;
    logoUrl: string;
    workspaceLabel: string;
    footerText: string;
    supportEmail: string;
}

const SETTINGS_COLLECTION = 'organizationSettings';
const SETTINGS_DOC = 'config';

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
    organizationName: process.env.REACT_APP_ORG_NAME || 'Kurumsal YBS',
    organizationSubtitle: process.env.REACT_APP_ORG_SUBTITLE || 'Yönetim Bilişim Sistemi',
    logoUrl: process.env.REACT_APP_ORG_LOGO_URL || '',
    workspaceLabel: process.env.REACT_APP_WORKSPACE_LABEL || 'Çalışma Alanı',
    footerText: process.env.REACT_APP_ORG_FOOTER || 'Kurumsal Yönetim Bilişim Sistemi',
    supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || '',
};

export async function getOrganizationSettings(
    companyId?: string | null
): Promise<OrganizationSettings> {
    if (isDemoModeActive()) {
        return {
            organizationName: DEMO_COMPANY.name,
            organizationSubtitle: DEMO_COMPANY.subtitle,
            logoUrl: DEMO_COMPANY.logoUrl,
            workspaceLabel: DEMO_COMPANY.workspaceLabel,
            footerText: DEMO_COMPANY.footerText,
            supportEmail: DEMO_COMPANY.supportEmail,
        };
    }
    try {
        if (companyId && companyId !== 'default-company') {
            const companyRef = doc(db, 'companies', companyId);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
                const data = companySnap.data();
                return {
                    organizationName: data.name || DEFAULT_ORG_SETTINGS.organizationName,
                    organizationSubtitle: data.subtitle || DEFAULT_ORG_SETTINGS.organizationSubtitle,
                    logoUrl: data.logoUrl || '',
                    workspaceLabel: data.workspaceLabel || 'Çalışma Alanı',
                    footerText: data.footerText || data.name || DEFAULT_ORG_SETTINGS.footerText,
                    supportEmail: data.supportEmail || '',
                };
            }
        }

        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { ...DEFAULT_ORG_SETTINGS, ...(snap.data() as Partial<OrganizationSettings>) };
        }
        return DEFAULT_ORG_SETTINGS;
    } catch (error) {
        console.error('Error fetching organization settings:', error);
        return DEFAULT_ORG_SETTINGS;
    }
}

export async function updateOrganizationSettings(
    settings: Partial<OrganizationSettings>,
    companyId?: string | null
): Promise<void> {
    if (companyId && companyId !== 'default-company') {
        const companyRef = doc(db, 'companies', companyId);
        await setDoc(
            companyRef,
            {
                name: settings.organizationName,
                subtitle: settings.organizationSubtitle,
                logoUrl: settings.logoUrl,
                workspaceLabel: settings.workspaceLabel,
                footerText: settings.footerText,
                supportEmail: settings.supportEmail,
            },
            { merge: true }
        );
        return;
    }

    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    await setDoc(ref, settings, { merge: true });
}
