export interface ViewDefinition {
  name: string;
  columns: string[];
}

export const VIEW_DEFINITIONS: ViewDefinition[] = [
  {
    name: 'ViewEmployeeCore',
    columns: [
      'Headcount', 'FTEActual', 'DaysWorkedValue', 'SicknessDays', 'AbsenceDays',
      'AbsenceShortTermDays', 'AbsenceLongTermDays', 'AbsenceField04', 'AbsenceField07',
      'AbsenceField09', 'AbsenceField10',
      'LeaverInPeriodValue', 'VoluntaryLeaverValue', 'InvoluntaryLeaverValue',
      'StarterInPeriodValue', 'ServiceLengthValue', 'AgeValue',
      'ManagerHeadcount', 'ManagerSalary',
      'SalaryFTE', 'SalaryTotal', 'PayBasicPay', 'PayOvertimeCosts',
      'IsFemaleManagerFlag', 'BMEEmployee',
      'CountPromotions', 'CountDemotions', 'CountTransfers',
      'RehiredFlag', 'ReferredHiresValue', 'InternalHireFlag', 'ExternalHireFlag',
      'HeadcountContingent', 'LeaveOfAbsenceFlag', 'RetirementFlag',
      'ApproachingRetirementFlag', 'SalaryRiseLast12Flag',
      'EmployeeNumber', 'EmployeeID', 'PeriodStart',
      'ContractType', 'SummaryStatus', 'PrimaryJob',
      'JuniorDoctorText', 'IsManagerText', 'IsHR',
      'LeaveReason', 'LeaveReasonCategory', 'LeaverPreventableText',
      'NewEmployerAfterLeaving', 'OrgUnit03_Name',
      'EmployedAtStart', 'SicknessEvents',
      'CompetencyCount', 'CompetentCount', 'MandCompetencyCount',
      'TrainingField01', 'TrainingField02', 'TrainingField03',
      'MeetsReqMandValue', 'MeetsReqMandTotalValue',
      'MeetsReqNonMandValue', 'MeetsReqNonMandTotalValue',
      'LeaversLongTermSick', 'JobCode',
      'SicknessDaysInfectiousDiseases', 'StressSicknessDays',
      'TotalContingentCost', 'TotalPay'
    ]
  },
  {
    name: 'ViewEmployeeR12M',
    columns: [
      'Headcount', 'HeadcountPerm', 'HeadcountStartPeriod',
      'AvgHeadcount_L12M', 'L12M_AvgTotalHeadcount',
      'NumLeavers', 'L12M_NumLeaversPerm', 'L12M_NumVoluntary', 'L12M_NumInvoluntary',
      'L12M_NumLeaversNurses', 'L12M_NumLeaversPermWLB', 'L12M_NumLeaversPermPrev',
      'L12M_NumLeaversPermLS', 'L12M_NumLeaversPermLOS', 'L12M_EarlypermLeavers',
      'L12M_NumLeaversLostSTF', 'L12M_NumRetirees', 'L12M_RetirementAge',
      'L12M_NumLeaversTUPE', 'L12M_NumLeaversTUPEAdj', 'L12M_NumLeaversTUPERelated',
      'L12M_HeadcountTurnover', 'L12M_HeadcountTurnoverAdj',
      'L12M_FTELeavers', 'L12M_FTELeaversAdj', 'L12M_FTEActual', 'L12M_FTEAdjusted',
      'L12M_AvgFTEPerm', 'L12M_AvgHeadcountAdj', 'L12M_TerminationsAdj',
      'L12M_DaysWorked', 'L12M_SicknessDays',
      'L12M_AbsenceDaysShortTerm', 'L12M_AbsenceDaysLongTerm',
      'L12M_AbsenceField04', 'L12M_AbsenceField05', 'AbsenceField07',
      'L12M_HeadcountAvgNurses', 'L12M_TerminationsNurses',
      'Actual_Total_FTE', 'Actual_Contingent_FTE',
      'ContractedHours', 'HourlyRate', 'SalaryTotal',
      'ManagerHeadcount', 'ManagerSalary', 'RookieHeadcount', 'RookieSalary',
      'AvgServiceLengthValue', 'ApproachingRetirement', 'NumRetained',
      'Core_Val_LoACount',
      'ESTABLISHMENT_Total_Substantive_FTE', 'ESR_Actual_Substantive_FTE',
      'JuniorDoctor', 'SicknessEvents',
      'ShiftStatus',
      'FirstMHeadcountTurnover', 'LastMHeadcount',
      'firstMFteActual', 'LastMFteActual', 'FirstMFteAdj', 'LastMFteAdj',
      'L12M_Terminations', 'L12M_TerminationsInvoluntary', 'L12M_TerminationsVoluntary',
      'L12M_STFLostLeavers'
    ]
  },
  {
    name: 'ViewEstablishment',
    columns: [
      'AssignmentCount', 'AssignmentCountStartPeriod',
      'ActualTotalFTE', 'ActualSubstantiveFTE', 'ActualContingentFTE',
      'TotalSubstantiveFTE', 'WTEVacancies',
      'AbsenceFTE', 'SicknessFTE', 'AbsenceDays', 'DaysWorked',
      'ContractedHours', 'HourlyRate', 'Salary',
      'ManagerCount', 'ManagerSalary', 'RookieCount', 'RookieSalary',
      'ServiceLength', 'Leaver', 'AppRetireCount', 'RetainedInPeriod', 'LOACount',
      'L12M_DaysWorked', 'L12M_SicknessDays',
      'L12M_AbsenceDaysShortTerm', 'L12M_AbsenceDaysLongTerm',
      'L12M_AbsenceField04', 'L12M_AbsenceField05', 'AbsenceField07',
      'L12M_Terminations', 'L12M_TerminationsAdj', 'L12M_TerminationsInvoluntary',
      'L12M_TerminationsVoluntary', 'L12M_STFLostLeavers',
      'L12M_TerminationsNurses', 'L12M_HeadcountAvgNurses',
      'L12M_PermLeavers', 'L12M_Permwlbleavers', 'L12M_permprevleavers',
      'L12M_permLSleavers', 'L12M_PermLeaversLOS', 'L12M_EarlypermLeavers',
      'L12M_Retirees', 'L12M_RetirementAge', 'L12M_FTE',
      'PermHeadcount', 'AvgHeadcount_L12M', 'L12M_AvgHeadcountAdj',
      'JunDoc', 'SicknessEvents', 'Shift_Status',
      'TotalContingentCost', 'TotalPay',
      'L12M_NumLeaversTUPEAdjValue', 'L12M_HeadcountTurnoverAdjValue'
    ]
  },
  {
    name: 'ViewContingentWorkforce',
    columns: [
      'CWFS_val_Hours', 'CWFS_val_TotalCost',
      'CWFS_val_HoursInternalBank', 'CWFS_val_TotalCostInternalBank',
      'CWFS_val_HoursDirectEngage', 'CWFS_val_TotalPayrollDirectEngage', 'CWFS_val_TotalCostDirectEngage',
      'CWFS_val_HoursStandardEngage', 'CWFS_val_TotalCostStandardEngage',
      'CWFS_val_HoursColabBank', 'CWFS_val_TotalCostColabBank',
      'CWFS_val_NumberofShifts', 'CWFS_val_NumberofShiftsInternalBank',
      'CWFS_val_NumberofShiftsColabBank', 'CWFS_val_NumberofShiftsDirectEngage',
      'CWFS_val_NumberofShiftsStandardEngage'
    ]
  },
  {
    name: 'ViewTempStaffing',
    columns: [
      'HoursPaid', 'TotalCost', 'TotalHourlyCharge',
      'IsCount', 'IsFilled', 'StaffType', 'PlacementType', 'TSStatus',
      'OverCaprate', 'NHSICapRate'
    ]
  },
  {
    name: 'ViewAppraisals',
    columns: [
      'AppraisalCount', 'AppraisalStatus', 'MetReqCount', 'JobGroupName'
    ]
  },
  {
    name: 'ViewTraining',
    columns: [
      'TrainingCount', 'CompetentCount', 'ComplianceTarget', 'Banding02'
    ]
  },
  {
    name: 'ViewRoster',
    columns: [
      'BankAgencyUsageHours', 'Filled_Hours', 'TotalUnavailability',
      'Period_ContractedHours', 'Total_Unfilled_hours', 'Total_Demand_Hours',
      'NetHoursBalance', 'AgencyUsage_Hours', 'BankUsage_Hours'
    ]
  },
  {
    name: 'ViewAbsencesByPeriod',
    columns: [
      'JobCode', 'AbsenceType', 'Headcount'
    ]
  },
  {
    name: 'ViewRecruitmentVacancies',
    columns: ['VacancyID']
  },
  {
    name: 'ViewRecruitmentApplicants',
    columns: ['ApplicantID']
  },
  {
    name: 'ViewMetrics',
    columns: [
      'DaysWorkedValue', 'SicknessDays', 'LeaverInPeriodValue',
      'EarlyLeaversCount', 'SicknessDaysInfectiousDiseases', 'StressSicknessDays'
    ]
  },
  {
    name: 'ViewBenchmarkingAbsences',
    columns: ['FTE_days_available', 'FTE_days_lost']
  },
  {
    name: 'ViewBenchmarkingTurnover',
    columns: [
      'AVGFTEDenoms', 'SUMFTEJoiners', 'SUMFTELeavers',
      'AVGHCDenoms', 'SUMHCJoiners', 'SUMHCLeavers'
    ]
  },
  {
    name: 'HRI_vw_Emp_Core_Rolling12',
    columns: [
      'EMPSUMM_val_Headcount', 'EMPSUMM_val_LeaverInPeriod',
      'EMPSUMM_val_VoluntaryLeaver', 'EMPSUMM_val_InVoluntaryLeaver',
      'EMPSUMM_val_StarterInPeriod', 'EMPSUMM_val_InternalHire',
      'EMPSUMM_val_ServiceLength', 'EMPSUMM_val_FTEActual',
      'EMPSUMM_date_PeriodStart'
    ]
  },
  {
    name: 'HRI_vw_Shift_Efficiency_Summary',
    columns: [
      'SES_val_Hours_Paid', 'SES_val_Payrate', 'SES_val_avg_pay_rate',
      'SES_val_TotalAssumedCost'
    ]
  },
  {
    name: 'HRI_vw_Emp_ContractorActivity',
    columns: [
      'EMPCON_text_ResourceRelationship', 'EMPCON_val_Marginpc'
    ]
  },
  {
    name: 'HRI_vw_NHSP',
    columns: ['filled_no_count', 'filled_yes_count']
  },
  {
    name: 'HRI_vw_Training_Competency',
    columns: ['val_count_meets_comp']
  }
];
