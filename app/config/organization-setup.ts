export interface OrganizationSetupSection {
  id: string;
  label: string;
  description: string;
  href?: string;
  children?: OrganizationSetupSection[];
}

export const organizationSetupSections: OrganizationSetupSection[] = [
  {
    id: "organization",
    label: "Company",
    href: "/admin/organization-setup?section=organization",
    description: "Manage organization-level setup and related details.",
    children: [
      {
        id: "organization-setup",
        label: "Company Details",
        href: "/admin/organization-setup",
        description:
          "Manage the core profile, branding, company details, and primary organization information.",
      },
      {
        id: "organization-policy",
        label: "Company Policy",
        href: "/admin/organization-setup?section=organization-policy",
        description:
          "Define policies that apply across your organization.",
      },
      {
        id: "organization-structure",
        label: "Company Structure",
        href: "/admin/organization-setup?section=organization-structure",
        description:
          "Manage the structure of your organization.",
        children: [
          {
            id: "business-unit",
            label: "Business Unit",
            href: "/admin/organization-setup?section=business-unit",
            description: "Create and manage business units.",
          },
          {
            id: "branch",
            label: "Branch",
            href: "/admin/organization-setup?section=branch",
            description: "Create and manage branches.",
          },
          {
            id: "departments",
            label: "Departments",
            href: "/admin/organization-setup?section=departments",
            description: "Create and manage departments.",
          },
          {
            id: "designations",
            label: "Designations",
            href: "/admin/organization-setup?section=designations",
            description: "Create and manage designations.",
          },
        ],
      },
    ],
  },
];

export const organizationSetupTopNavigation = [
  ["users", "Users"],
  ["organization-setup", "Organization Setup"],
  ["access-control", "User Access Control"],
  ["manage-service", "Manage Service"],
  ["automation", "Automation"],
  ["approvals", "Approvals"],
  ["subscription", "Subscription"],
] as const;

const flattenSections = (
  sections: OrganizationSetupSection[],
): Array<[string, OrganizationSetupSection]> =>
  sections.flatMap((section) => {
    const entries: Array<[string, OrganizationSetupSection]> = [[section.id, section]];

    if (section.children?.length) {
      entries.push(...flattenSections(section.children));
    }

    return entries;
  });

export const organizationSetupSectionMap = Object.fromEntries(
  flattenSections(organizationSetupSections),
) as Record<string, OrganizationSetupSection>;
