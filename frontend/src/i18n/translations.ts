export type Language = 'en' | 'bn';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    appName: 'Recroot',
    navHome: 'Home',
    navPositions: 'Positions',
    navAttributes: 'Attribute Library',
    navProfile: 'My Profile',
    navAdminUsers: 'Manage Users',
    navLogin: 'Sign In',
    navRegister: 'Register',
    navLogout: 'Sign Out',
    searchPlaceholder: 'Search positions, candidates, attributes...',

    // Stats
    statCvs24h: 'CVs Created (24h)',
    statPositions: 'Total Positions',
    statCandidates: 'Candidates',
    statRecruiters: 'Recruiters',
    statSubmittedCvs: 'Published CVs',

    // Titles
    latestPositions: 'Latest Positions',
    popularPositions: 'Most Popular Positions',
    tagCloud: 'Technology Tag Cloud',
    allPositions: 'Available Positions',
    attributeLibrary: 'Attribute Library',
    userManagement: 'User Management',

    // Table Toolbar
    itemsSelected: 'selected',
    actionView: 'View',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    actionDuplicate: 'Duplicate',
    actionPublish: 'Publish',
    actionCreateCV: 'Generate CV',
    actionCreatePosition: 'Create Position',
    actionCreateAttribute: 'Add Attribute',

    // Roles & Badges
    roleCandidate: 'Candidate',
    roleRecruiter: 'Recruiter',
    roleAdmin: 'Administrator',
    statusDraft: 'Draft',
    statusPublished: 'Published',
    badgeEligible: 'Eligible',
    badgeRestricted: 'Access Restricted',

    // Profile Sections
    tabMe: 'Me (Mandatory)',
    tabInfo: 'Info (Custom Attributes)',
    tabProjects: 'Projects',
    tabCVs: 'My CVs',

    // Profile auto-save status
    autoSaveSaving: 'Auto-saving profile...',
    autoSaveSaved: 'All changes saved',
    autoSaveError: 'Auto-save failed (version conflict)',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    actions: 'Actions',
    emptyList: 'No records found.',
    like: 'Like',
    liked: 'Liked',
    discussions: 'Discussions',
    postComment: 'Post Comment',

    // Optimistic locking
    conflictTitle: 'Optimistic Locking Conflict',
    conflictDesc: 'This record was modified in another session. Please reload to fetch the latest data.',
    reload: 'Reload Data',
  },
  bn: {
    // Navigation
    appName: 'রিকরুট',
    navHome: 'হোম',
    navPositions: 'পজিশনসমূহ',
    navAttributes: 'অ্যাট্রিবিউট লাইব্রেরি',
    navProfile: 'আমার প্রোফাইল',
    navAdminUsers: 'ইউজার ব্যবস্থাপনা',
    navLogin: 'সাইন ইন',
    navRegister: 'রেজিস্টার',
    navLogout: 'সাইন আউট',
    searchPlaceholder: 'পজিশন, প্রার্থী, অ্যাট্রিবিউট খুঁজুন...',

    // Stats
    statCvs24h: 'নতুন সিভি (২৪ ঘণ্টা)',
    statPositions: 'মোট পজিশন',
    statCandidates: 'ক্যান্ডিডেট',
    statRecruiters: 'রিকরুটমেন্ট টিম',
    statSubmittedCvs: 'প্রকাশিত সিভি',

    // Titles
    latestPositions: 'সর্বশেষ পজিশনসমূহ',
    popularPositions: 'জনপ্রিয় পজিশনসমূহ',
    tagCloud: 'প্রযুক্তি ট্যাগ ক্লাউড',
    allPositions: 'উপলব্ধ পজিশনসমূহ',
    attributeLibrary: 'অ্যাট্রিবিউট লাইব্রেরি',
    userManagement: 'ইউজার অ্যাকাউন্টস',

    // Table Toolbar
    itemsSelected: 'টি নির্বাচিত',
    actionView: 'দেখুন',
    actionEdit: 'সম্পাদনা',
    actionDelete: 'মুছে ফেলুন',
    actionDuplicate: 'অনুলিপি',
    actionPublish: 'প্রকাশ করুন',
    actionCreateCV: 'সিভি তৈরি করুন',
    actionCreatePosition: 'নতুন পজিশন',
    actionCreateAttribute: 'নতুন অ্যাট্রিবিউট',

    // Roles & Badges
    roleCandidate: 'ক্যান্ডিডেট',
    roleRecruiter: 'রিকরুটার',
    roleAdmin: 'এডমিন',
    statusDraft: 'খসড়া',
    statusPublished: 'প্রকাশিত',
    badgeEligible: 'উপযুক্ত',
    badgeRestricted: 'সীমাবদ্ধ',

    // Profile Sections
    tabMe: 'ব্যক্তিগত তথ্য',
    tabInfo: 'অতিরিক্ত দক্ষতা (অ্যাট্রিবিউট)',
    tabProjects: 'প্রকল্পসমূহ',
    tabCVs: 'আমার সিভি তালিকা',

    // Profile auto-save status
    autoSaveSaving: 'অটো-সেভ হচ্ছে...',
    autoSaveSaved: 'সকল পরিবর্তন সংরক্ষিত',
    autoSaveError: 'অটো-সেভ ব্যর্থ (ভার্সন কনফ্লিক্ট)',

    // Common
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',
    actions: 'অ্যাকশন',
    emptyList: 'কোন তথ্য পাওয়া যায়নি।',
    like: 'লাইক',
    liked: 'লাইক দেওয়া হয়েছে',
    discussions: 'আলোচনা বোর্ড',
    postComment: 'মন্তব্য করুন',

    // Optimistic locking
    conflictTitle: 'অপটিমিস্টিক লকিং কনফ্লিক্ট',
    conflictDesc: 'অন্য স্থান থেকে তথ্য পরিবর্তিত হয়েছে। সর্বশেষ তথ্য দেখতে পেজ রিফ্রেশ করুন।',
    reload: 'রিফ্রেশ করুন',
  },
};
