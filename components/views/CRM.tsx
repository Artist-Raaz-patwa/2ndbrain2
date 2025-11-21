
import React, { useEffect, useState } from 'react';
import { Contact, Project, Task, Subtask, Transaction } from '../../types';
import { Search, Plus, Trash2, X, Briefcase, LayoutGrid, User, ArrowRight, DollarSign, CheckSquare, MoreHorizontal, ChevronDown, ChevronRight, Calendar, FileText, Printer, Download, Filter, CheckCircle2, Circle, Sparkles, Loader2, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { dataManager } from '../../services/dataManager';
import { generateReportSummary } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';

type CRMViewMode = 'DASHBOARD' | 'PROJECTS' | 'CONTACTS' | 'PROJECT_DETAIL';

const CRM: React.FC = () => {
  const [viewMode, setViewMode] = useState<CRMViewMode>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<any>({
    activeProjects: 0,
    totalProjects: 0,
    totalPipelineValue: 0,
    totalCollectedValue: 0,
    projectCompletionData: []
  });
  const [currency, setCurrency] = useState('$');

  // Forms
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskBillable, setNewTaskBillable] = useState(false);
  const [newTaskAmount, setNewTaskAmount] = useState('');

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // New Contact Form
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');

  // Report Generator State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDate, setReportDate] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportTasks, setReportTasks] = useState<{ completed: Task[], pending: Task[] }>({ completed: [], pending: [] });
  const [reportProjectIds, setReportProjectIds] = useState<Set<string>>(new Set());
  const [includePending, setIncludePending] = useState(false);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const loadedProjects = dataManager.getProjects();
      setProjects(loadedProjects);
      setContacts(dataManager.getContacts());
      setMetrics(dataManager.getCRMMetrics());
      setCurrency(dataManager.getCurrencySymbol());
      const allTasks = dataManager.getTasks(); 
      setTasks(allTasks);
    };
    refresh();
    
    // Set default report date to local today YYYY-MM-DD
    const localToday = new Date();
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    setReportDate(`${year}-${month}-${day}`);

    return dataManager.subscribe(refresh);
  }, []);

  // Filter tasks when inputs change
  useEffect(() => {
    if (showReportModal && reportDate) {
      const [selYear, selMonth, selDay] = reportDate.split('-').map(Number);

      // 1. Filter Tasks
      const relevantTasks = tasks.filter(t => {
        if (!reportProjectIds.has(t.projectId)) return false;
        if (t.isCompleted && t.completedAt) {
           const d = new Date(t.completedAt);
           const isSameDay = d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth && d.getDate() === selDay;
           return isSameDay;
        }
        return false;
      });

      const pendingTasks = includePending ? tasks.filter(t => {
          if (!reportProjectIds.has(t.projectId)) return false;
          return !t.isCompleted;
      }) : [];

      setReportTasks({ completed: relevantTasks, pending: pendingTasks });
    }
  }, [showReportModal, reportDate, tasks, reportProjectIds, projects, includePending]);

  const handleOpenReportModal = () => {
      // Default: Select all active projects
      const activeIds = new Set(projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').map(p => p.id));
      setReportProjectIds(activeIds);
      setShowReportModal(true);
  };

  const toggleReportProject = (id: string) => {
      const newSet = new Set(reportProjectIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setReportProjectIds(newSet);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const selectedProjects = projects.filter(p => reportProjectIds.has(p.id));
    const summaryData = {
      date: reportDate,
      projects: selectedProjects.map(p => ({ name: p.name, client: p.clientName })),
      completedTasks: reportTasks.completed.map(t => ({ title: t.title, billable: t.isBillable, amount: t.amount })),
      pendingTasks: reportTasks.pending.map(t => ({ title: t.title })),
      totalValueGenerated: reportTasks.completed.reduce((acc, t) => acc + (t.isBillable ? t.amount : 0), 0)
    };

    const summary = await generateReportSummary(summaryData);
    setReportNote(summary);
    setIsGeneratingSummary(false);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectClient) {
      dataManager.addProject(newProjectName, newProjectClient, newProjectDeadline || new Date().toISOString().split('T')[0]);
      setShowProjectForm(false);
      setNewProjectName('');
      setNewProjectClient('');
      setNewProjectDeadline('');
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Delete this project and all its tasks?')) {
      dataManager.deleteProject(id);
      if (selectedProject?.id === id) setSelectedProject(null);
      setViewMode('PROJECTS');
    }
  };

  const handleOpenProject = (p: Project) => {
    setSelectedProject(p);
    setViewMode('PROJECT_DETAIL');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle) return;
    dataManager.addTask(selectedProject.id, newTaskTitle, newTaskBillable, parseFloat(newTaskAmount) || 0);
    setShowTaskForm(false);
    setNewTaskTitle('');
    setNewTaskBillable(false);
    setNewTaskAmount('');
  };

  const handleToggleTask = (task: Task) => {
    dataManager.updateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete task?')) dataManager.deleteTask(id);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const subtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      isCompleted: false
    };

    dataManager.updateTask({
      ...task,
      subtasks: [...(task.subtasks || []), subtask]
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    dataManager.updateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    dataManager.addContact({ name: newContactName, role: newContactRole, company: newContactCompany, status: 'Lead' });
    setShowContactForm(false);
    setNewContactName(''); setNewContactRole(''); setNewContactCompany('');
  };

  // --- SVG Chart Generator for Report ---
  const generatePieChartSVG = (data: { name: string; value: number; color: string }[], size = 120) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return '';

    let startAngle = 0;
    const center = size / 2;
    const radius = (size / 2) - 5; 

    const paths = data.map(item => {
      const angle = (item.value / total) * 360;
      if (angle >= 360) {
          return `<circle cx="${center}" cy="${center}" r="${radius}" fill="${item.color}" />`;
      }
      
      const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
      
      const x1 = center + radius * Math.cos(toRad(startAngle));
      const y1 = center + radius * Math.sin(toRad(startAngle));
      
      const endAngle = startAngle + angle;
      const x2 = center + radius * Math.cos(toRad(endAngle));
      const y2 = center + radius * Math.sin(toRad(endAngle));
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
      
      const el = `<path d="${path}" fill="${item.color}" stroke="white" stroke-width="2" />`;
      startAngle += angle;
      return el;
    });

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${paths.join('')}
      </svg>
    `;
  };

  // Calculate Project/Client Value for the Chart
  const getClientValueDistribution = () => {
    const clientMap = new Map<string, number>();
    
    // Iterate through selected projects to calculate total value (Investment/Expenditure by Client)
    reportProjectIds.forEach(pid => {
        const proj = projects.find(p => p.id === pid);
        if (!proj) return;
        
        const projTasks = tasks.filter(t => t.projectId === pid);
        const projValue = projTasks.reduce((sum, t) => sum + (t.isBillable ? t.amount : 0), 0);
        
        const current = clientMap.get(proj.clientName) || 0;
        clientMap.set(proj.clientName, current + projValue);
    });

    const data = Array.from(clientMap).map(([name, value]) => ({ name, value, color: '#000' }));
    
    // Sort and Color
    const sorted = data.sort((a,b) => b.value - a.value);
    // Use vibrant colors for the pie chart as requested, while keeping the report B&W
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#db2777', '#4f46e5'];
    return sorted.map((item, i) => ({ ...item, color: colors[i % colors.length] }));
  };

  const generatePDFContent = () => {
    const totalDailyValue = reportTasks.completed.reduce((acc, t) => acc + (t.isBillable ? t.amount : 0), 0);
    
    const clientData = getClientValueDistribution();
    const pieChartSVG = includeFinancials && clientData.length > 0 ? generatePieChartSVG(clientData) : '';

    // Task Grouping
    const tasksByProject: Record<string, { completed: Task[], pending: Task[] }> = {};
    reportProjectIds.forEach(pid => {
        const comp = reportTasks.completed.filter(t => t.projectId === pid);
        const pend = reportTasks.pending.filter(t => t.projectId === pid);
        if (comp.length > 0 || pend.length > 0) {
            tasksByProject[pid] = { completed: comp, pending: pend };
        }
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Progress Report - ${reportDate}</title>
        <style>
          @page { margin: 0; size: A4; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 0; background: #fff; }
          .page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; margin: 0 auto; box-sizing: border-box; }
          
          /* Modern Header */
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 4px solid #000; margin-bottom: 30px; }
          .brand { font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; background: #000; color: #fff; padding: 4px 8px; display: inline-block; margin-bottom: 5px;}
          .report-title { font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; line-height: 1; margin: 0; }
          .report-meta { text-align: right; font-size: 11px; color: #555; font-family: monospace; line-height: 1.4; }

          /* Grid Layout */
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          
          /* Cards */
          .card { background: #f9f9f9; padding: 20px; border-left: 3px solid #000; min-height: 140px; }
          .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 1px; }
          .summary-text { font-size: 13px; line-height: 1.6; color: #222; }

          /* Metrics Section */
          .metrics-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .metric-label { font-size: 12px; color: #555; }
          .metric-val { font-size: 14px; font-weight: 700; }
          
          /* Chart Section */
          .chart-container { display: flex; align-items: center; gap: 20px; margin-top: 15px; }
          .chart-legend { flex: 1; }
          .legend-item { display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 4px; }
          .color-dot { width: 8px; height: 8px; display: inline-block; margin-right: 6px; border-radius: 50%; }

          /* Projects */
          .section-title { font-size: 16px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #000; margin: 40px 0 20px 0; padding-bottom: 5px; }
          
          .project-block { margin-bottom: 25px; break-inside: avoid; }
          .project-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
          .proj-name { font-weight: 700; font-size: 14px; text-transform: uppercase; }
          .client-tag { font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 2px; color: #444; }
          
          .task-list { font-size: 12px; border-top: 1px solid #eee; }
          .task-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
          .task-row.pending { color: #777; font-style: italic; }
          .icon { font-family: monospace; font-weight: bold; margin-right: 6px; display: inline-block; width: 12px; }

          .footer { position: fixed; bottom: 15mm; left: 20mm; right: 20mm; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div>
              <div class="brand">2ndBrain CRM</div>
              <h1 class="report-title">Progress Report</h1>
            </div>
            <div class="report-meta">
              DATE: ${reportDate}<br/>
              REF: ${Date.now().toString().slice(-6)}
            </div>
          </header>

          <div class="grid-2">
             <div class="card">
                <div class="card-label">Executive Summary</div>
                <div class="summary-text">${reportNote || 'No summary provided.'}</div>
             </div>

             ${includeFinancials ? `
             <div class="card" style="border-left-color: #555;">
                <div class="card-label">Workload Analysis</div>
                <div class="metrics-row">
                   <span class="metric-label">Daily Output</span>
                   <span class="metric-val">${currency}${totalDailyValue.toFixed(2)}</span>
                </div>
                <div class="metrics-row">
                   <span class="metric-label">Active Clients</span>
                   <span class="metric-val">${new Set(projects.filter(p => reportProjectIds.has(p.id)).map(p => p.clientName)).size}</span>
                </div>
                
                ${clientData.length > 0 ? `
                <div class="chart-container">
                    <div style="width: 60px; height: 60px;">${pieChartSVG}</div>
                    <div class="chart-legend">
                        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; color: #444;">Client Expenditure (Total)</div>
                        ${clientData.map(e => `
                            <div class="legend-item">
                               <div><span class="color-dot" style="background:${e.color}"></span>${e.name}</div>
                               <span style="font-weight:600">${currency}${e.value.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
             </div>
             ` : ''}
          </div>

          <div class="section-title">Project Activity</div>

          ${Object.keys(tasksByProject).length === 0 ? '<p style="text-align:center; color:#999; font-style:italic;">No project activity recorded for this date.</p>' : ''}

          ${Object.keys(tasksByProject).map(pid => {
              const proj = projects.find(p => p.id === pid);
              const { completed, pending } = tasksByProject[pid];
              
              return `
              <div class="project-block">
                  <div class="project-header">
                      <span class="proj-name">${proj?.name}</span>
                      <span class="client-tag">${proj?.clientName}</span>
                  </div>
                  
                  <div class="task-list">
                    ${completed.map(t => `
                        <div class="task-row">
                            <div><span class="icon">✓</span> ${t.title}</div>
                            ${t.isBillable ? `<div style="font-weight:600">${currency}${t.amount.toFixed(2)}</div>` : ''}
                        </div>
                        ${t.subtasks.map(st => `<div class="task-row" style="padding-left: 20px; font-size: 11px; color: #666;">- ${st.title}</div>`).join('')}
                    `).join('')}

                    ${pending.map(t => `
                        <div class="task-row pending">
                            <div><span class="icon">○</span> ${t.title}</div>
                            <div style="font-size: 10px;">PENDING</div>
                        </div>
                    `).join('')}
                  </div>
              </div>
              `;
          }).join('')}
          
          <div class="footer">
            CONFIDENTIAL • GENERATED BY 2NDBRAIN SYSTEM • ${new Date().getFullYear()}
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
  }

  const handlePrintPDF = () => {
    const content = generatePDFContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
    }
  };

  // --- Render Sub-components ---

  const renderDashboard = () => {
    // --- Calculations for Dashboard ---
    
    // 1. Revenue History (Last 30 Days)
    const last30Days = [...Array(30)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const revenueData = last30Days.map(dateStr => {
        // Find tasks completed on this date (approximate string match for simplicity)
        const dayTotal = tasks.reduce((sum, t) => {
            if (t.isCompleted && t.isBillable && t.completedAt) {
                const tDate = new Date(t.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (tDate === dateStr) return sum + t.amount;
            }
            return sum;
        }, 0);
        return { date: dateStr, value: dayTotal };
    });

    // 2. Task Completion Status
    const completedTasksCount = tasks.filter(t => t.isCompleted).length;
    const pendingTasksCount = tasks.length - completedTasksCount;
    const taskStatusData = [
        { name: 'Completed', value: completedTasksCount, color: '#ffffff' }, // White
        { name: 'Pending', value: pendingTasksCount, color: '#333333' } // Dark Gray
    ];

    // 3. Upcoming Deadlines (Active Projects)
    const upcomingDeadlines = projects
        .filter(p => p.status === 'In Progress' || p.status === 'Planning')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5);

    // 4. Efficiency (Avg tasks completed per project)
    const overallCompletionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
               <div>
                   <h2 className="text-2xl font-light">Overview</h2>
                   <p className="text-neutral-500 text-xs font-mono mt-1 uppercase">Performance Metrics & Activity</p>
               </div>
               <div className="text-right">
                   <span className="text-xs text-neutral-500 font-mono block">TOTAL REVENUE (LIFETIME)</span>
                   <span className="text-3xl font-bold text-white">{currency}{metrics.totalCollectedValue?.toLocaleString() || 0}</span>
               </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 flex flex-col justify-between h-24">
                    <div className="text-neutral-500 text-[10px] uppercase font-mono flex items-center gap-2">
                        <Briefcase size={12} /> Active Projects
                    </div>
                    <div className="text-2xl font-bold">{metrics.activeProjects}</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 flex flex-col justify-between h-24">
                     <div className="text-neutral-500 text-[10px] uppercase font-mono flex items-center gap-2">
                        <DollarSign size={12} /> Pipeline Value
                    </div>
                    <div className="text-2xl font-bold text-neutral-300">{currency}{metrics.totalPipelineValue?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 flex flex-col justify-between h-24">
                     <div className="text-neutral-500 text-[10px] uppercase font-mono flex items-center gap-2">
                        <CheckSquare size={12} /> Task Completion
                    </div>
                    <div className="text-2xl font-bold">{overallCompletionRate}%</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 p-4 flex flex-col justify-between h-24">
                     <div className="text-neutral-500 text-[10px] uppercase font-mono flex items-center gap-2">
                        <User size={12} /> Total Clients
                    </div>
                    <div className="text-2xl font-bold">{contacts.length}</div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
                {/* Revenue Area Chart */}
                <div className="lg:col-span-2 bg-black border border-neutral-800 p-6 flex flex-col">
                    <h3 className="text-xs font-mono uppercase text-neutral-500 mb-4 flex justify-between">
                        <span>Revenue Trend (30 Days)</span>
                        <span className="text-green-500 flex items-center gap-1"><TrendingUp size={10}/> Live</span>
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#333" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} interval={6} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }} itemStyle={{color:'#fff'}} formatter={(value) => [`${currency}${value}`, 'Revenue']} />
                                <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tasks Donut Chart */}
                <div className="bg-black border border-neutral-800 p-6 flex flex-col">
                    <h3 className="text-xs font-mono uppercase text-neutral-500 mb-4">Workload Distribution</h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }} itemStyle={{color:'#fff'}} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">{tasks.length}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">Total Tasks</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Lists Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Upcoming Deadlines */}
                <div className="border border-neutral-800 bg-black p-6">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xs font-mono uppercase text-neutral-500">Approaching Deadlines</h3>
                         <Calendar size={14} className="text-neutral-600" />
                    </div>
                    <div className="space-y-3">
                        {upcomingDeadlines.length === 0 ? (
                            <div className="text-sm text-neutral-600 italic">No upcoming active project deadlines.</div>
                        ) : (
                            upcomingDeadlines.map(p => {
                                const daysLeft = Math.ceil((new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-neutral-900 pb-2 last:border-0">
                                        <div>
                                            <div className="font-semibold text-white">{p.name}</div>
                                            <div className="text-xs text-neutral-500">{p.clientName}</div>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded ${daysLeft < 3 ? 'bg-red-900/20 text-red-500' : 'bg-neutral-900 text-neutral-400'}`}>
                                            {daysLeft < 0 ? 'Overdue' : `${daysLeft} Days`}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Activity (Project Values / Health) */}
                <div className="border border-neutral-800 bg-black p-6">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xs font-mono uppercase text-neutral-500">Project Values</h3>
                         <TrendingUp size={14} className="text-neutral-600" />
                    </div>
                     <div className="h-48 w-full">
                        <ResponsiveContainer>
                            <BarChart data={metrics.projectCompletionData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#111'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} formatter={(value) => [`${currency}${value}`, 'Value']} />
                                <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                                    {metrics.projectCompletionData?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill="#333" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderProjects = () => (
    <div className="animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => {
           // Calculate local progress for card
           const pTasks = tasks.filter(t => t.projectId === p.id);
           const completed = pTasks.filter(t => t.isCompleted).length;
           const progress = pTasks.length > 0 ? (completed / pTasks.length) * 100 : 0;
           const value = pTasks.reduce((acc, t) => acc + (t.isBillable ? t.amount : 0), 0);

           return (
             <div key={p.id} onClick={() => handleOpenProject(p)} className="group bg-black border border-neutral-800 p-6 hover:border-white transition-colors cursor-pointer relative">
               <div className="flex justify-between items-start mb-4">
                 <div className="bg-neutral-900 text-neutral-400 px-2 py-1 text-[10px] uppercase font-mono rounded">
                    {p.status}
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className="-rotate-45 text-white" />
                 </div>
               </div>
               
               <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
               <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
                 <Briefcase size={12} />
                 <span>{p.clientName}</span>
               </div>

               <div className="space-y-3">
                 <div className="flex justify-between text-xs text-neutral-400">
                   <span>Progress</span>
                   <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="h-1 bg-neutral-800 w-full">
                   <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }}></div>
                 </div>
                 <div className="flex justify-between items-end pt-2 border-t border-neutral-900">
                    <span className="text-xs text-neutral-600 font-mono">Est. Value</span>
                    <span className="text-sm font-bold text-white">{currency}{value.toLocaleString()}</span>
                 </div>
               </div>
             </div>
           );
        })}
        
        <button 
          onClick={() => setShowProjectForm(true)}
          className="border border-neutral-800 border-dashed flex flex-col items-center justify-center p-6 text-neutral-600 hover:text-white hover:border-white transition-colors min-h-[250px]"
        >
          <Plus size={32} strokeWidth={1} className="mb-4" />
          <span className="text-sm uppercase tracking-widest">New Project</span>
        </button>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="animate-in fade-in">
       <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 font-mono text-xs uppercase">
                <th className="py-4 font-normal pl-4">Name</th>
                <th className="py-4 font-normal">Role</th>
                <th className="py-4 font-normal">Company</th>
                <th className="py-4 font-normal">Status</th>
                <th className="py-4 font-normal text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {contacts.map(contact => (
                <tr key={contact.id} className="group hover:bg-neutral-900/50">
                  <td className="py-4 pl-4 font-semibold text-white">{contact.name}</td>
                  <td className="py-4 text-neutral-400">{contact.role}</td>
                  <td className="py-4 text-neutral-400">{contact.company}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase border ${
                       contact.status === 'Active' ? 'border-green-900 text-green-500' : 'border-neutral-800 text-neutral-500'
                    }`}>{contact.status}</span>
                  </td>
                  <td className="py-4 text-right pr-4">
                     <button onClick={() => dataManager.deleteContact(contact.id)} className="text-neutral-600 hover:text-red-500">
                       <Trash2 size={14} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
             <div className="text-center py-12 text-neutral-600 italic">No contacts in database.</div>
          )}
       </div>
       <button onClick={() => setShowContactForm(true)} className="mt-6 flex items-center gap-2 px-4 py-2 border border-neutral-800 text-sm hover:bg-white hover:text-black transition-colors">
          <Plus size={14} /> ADD CONTACT
       </button>
    </div>
  );

  const renderProjectDetail = () => {
    if (!selectedProject) return null;
    
    const pTasks = tasks.filter(t => t.projectId === selectedProject.id);
    const total = pTasks.reduce((sum, t) => sum + (t.isBillable ? t.amount : 0), 0);
    const completed = pTasks.filter(t => t.isCompleted).length;
    const progress = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;

    return (
      <div className="animate-in fade-in slide-in-from-right-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-neutral-800 pb-6">
          <div>
             <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase mb-2">
                <span onClick={() => setViewMode('PROJECTS')} className="hover:text-white cursor-pointer">Projects</span>
                <ChevronRight size={12} />
                <span>{selectedProject.clientName}</span>
             </div>
             <h1 className="text-3xl font-light text-white">{selectedProject.name}</h1>
             <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="px-2 py-1 bg-neutral-900 text-neutral-300 border border-neutral-800 text-xs uppercase">
                  {selectedProject.status}
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Calendar size={14} />
                  <span>Due: {selectedProject.deadline}</span>
                </div>
             </div>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
             <div>
               <div className="text-xs text-neutral-500 uppercase font-mono">Total Value</div>
               <div className="text-3xl font-bold text-white">{currency}{total.toLocaleString()}</div>
             </div>
             <div className="w-full">
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>{progress}% Complete</span>
                </div>
                <div className="w-32 h-1 bg-neutral-800">
                   <div className="h-full bg-white" style={{width: `${progress}%`}}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-mono uppercase text-neutral-500">Tasks & Deliverables</h3>
              <button onClick={() => setShowTaskForm(true)} className="text-xs bg-neutral-900 text-white border border-neutral-800 px-3 py-1 font-bold hover:bg-white hover:text-black flex items-center gap-2 transition-colors">
                 <Plus size={12} /> ADD TASK
              </button>
           </div>
           
           <div className="space-y-3">
              {pTasks.map(task => (
                <div key={task.id} className={`border border-neutral-800 bg-neutral-900/20 p-4 transition-all ${task.isCompleted ? 'opacity-50' : ''}`}>
                   <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                         <button 
                           onClick={() => handleToggleTask(task)}
                           className={`mt-1 w-5 h-5 border flex items-center justify-center transition-colors ${
                             task.isCompleted ? 'bg-green-500 border-green-500 text-black' : 'border-neutral-600 hover:border-white'
                           }`}
                         >
                            {task.isCompleted && <CheckSquare size={12} />}
                         </button>
                         <div className="flex-1">
                            <div className="flex items-center gap-2">
                               <span className={`font-medium ${task.isCompleted ? 'line-through text-neutral-500' : 'text-white'}`}>
                                 {task.title}
                               </span>
                               {task.isBillable && (
                                 <span className="text-[10px] bg-neutral-800 text-green-400 px-1.5 py-0.5 rounded border border-neutral-700">
                                   {currency}{task.amount}
                                 </span>
                               )}
                            </div>
                            
                            {/* Subtasks */}
                            <div className="mt-3 pl-2 space-y-1">
                               {task.subtasks?.map(st => (
                                 <div key={st.id} className="flex items-center gap-2 text-sm group">
                                    <div className="w-4 h-px bg-neutral-700"></div>
                                    <button 
                                      onClick={() => handleToggleSubtask(task, st.id)}
                                      className={`w-3 h-3 border text-[8px] flex items-center justify-center ${st.isCompleted ? 'bg-neutral-500 border-neutral-500 text-black' : 'border-neutral-700'}`}
                                    >
                                      {st.isCompleted && '✓'}
                                    </button>
                                    <span className={`${st.isCompleted ? 'text-neutral-600' : 'text-neutral-400'}`}>{st.title}</span>
                                 </div>
                               ))}
                               {expandedTaskId === task.id ? (
                                 <div className="flex items-center gap-2 mt-2 pl-6 animate-in fade-in">
                                    <input 
                                      autoFocus
                                      type="text" 
                                      value={newSubtaskTitle}
                                      onChange={e => setNewSubtaskTitle(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleAddSubtask(task.id)}
                                      placeholder="New subtask..."
                                      className="bg-transparent border-b border-neutral-700 text-xs text-white w-full focus:outline-none focus:border-white"
                                    />
                                    <button onClick={() => handleAddSubtask(task.id)}><Plus size={12} /></button>
                                 </div>
                               ) : (
                                 <button onClick={() => setExpandedTaskId(task.id)} className="text-[10px] text-neutral-600 hover:text-neutral-400 pl-6 mt-1 flex items-center gap-1">
                                   <Plus size={8} /> Add subtask
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-neutral-600 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                   </div>
                </div>
              ))}
              {pTasks.length === 0 && (
                <div className="text-center py-8 border border-dashed border-neutral-800 text-neutral-600 italic">
                  No tasks defined for this project.
                </div>
              )}
           </div>
           
           <div className="mt-8 pt-8 border-t border-neutral-800 flex justify-center">
              <button onClick={() => handleDeleteProject(selectedProject.id)} className="text-xs text-red-900 hover:text-red-500 flex items-center gap-2">
                 <Trash2 size={12} /> DELETE PROJECT
              </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 h-full pb-32 flex flex-col relative">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
         <div className="flex gap-8">
            <button 
              onClick={() => setViewMode('DASHBOARD')}
              className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${viewMode === 'DASHBOARD' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              <LayoutGrid size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setViewMode('PROJECTS')}
              className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${viewMode === 'PROJECTS' || viewMode === 'PROJECT_DETAIL' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              <Briefcase size={16} /> Projects
            </button>
            <button 
              onClick={() => setViewMode('CONTACTS')}
              className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${viewMode === 'CONTACTS' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              <User size={16} /> Clients
            </button>
            <div className="h-5 w-px bg-neutral-800 mx-2"></div>
            <button 
              onClick={handleOpenReportModal}
              className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors text-white hover:text-blue-400 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800 hover:border-neutral-600`}
            >
              <FileText size={16} /> Daily Report
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
         {viewMode === 'DASHBOARD' && renderDashboard()}
         {viewMode === 'PROJECTS' && renderProjects()}
         {viewMode === 'CONTACTS' && renderContacts()}
         {viewMode === 'PROJECT_DETAIL' && renderProjectDetail()}
      </div>

      {/* --- Modals --- */}

      {/* Report Generator Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-6xl h-[90vh] flex shadow-2xl overflow-hidden">
             
             {/* Left: Controls */}
             <div className="w-[400px] flex flex-col border-r border-neutral-800 bg-black/50 p-6 overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                    <h3 className="text-lg font-light text-white flex items-center gap-2">
                        <FileText size={18} /> Report Setup
                    </h3>
                    <button onClick={() => setShowReportModal(false)} className="text-neutral-500 hover:text-white"><X size={20}/></button>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-neutral-900 p-4 border border-neutral-800">
                        <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Report Date</label>
                        <input 
                           type="date" 
                           value={reportDate} 
                           onChange={e => setReportDate(e.target.value)}
                           className="w-full bg-black border border-neutral-700 text-white px-3 py-2 focus:outline-none focus:border-white text-sm"
                        />
                        <p className="text-[10px] text-neutral-500 mt-2">
                           * Shows tasks completed on this day.
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-neutral-500 uppercase font-mono">Select Projects</label>
                            <span className="text-[10px] text-neutral-400">{reportProjectIds.size} Selected</span>
                        </div>
                        <div className="bg-black border border-neutral-800 max-h-48 overflow-y-auto p-1 space-y-px">
                           {projects.map(p => (
                               <div 
                                 key={p.id} 
                                 onClick={() => toggleReportProject(p.id)}
                                 className={`flex items-center gap-3 p-2 cursor-pointer text-sm hover:bg-neutral-900 transition-colors ${reportProjectIds.has(p.id) ? 'text-white bg-neutral-900/50' : 'text-neutral-500'}`}
                               >
                                   <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${reportProjectIds.has(p.id) ? 'bg-white border-white' : 'border-neutral-700'}`}>
                                       {reportProjectIds.has(p.id) && <CheckSquare size={10} className="text-black" />}
                                   </div>
                                   <div className="flex-1 truncate">{p.name}</div>
                               </div>
                           ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-neutral-500 uppercase font-mono mb-2 block">Includes</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 p-2 border border-neutral-800 bg-black cursor-pointer hover:border-neutral-600 transition-colors">
                                <div className={`w-3 h-3 border flex items-center justify-center ${includePending ? 'bg-white border-white' : 'border-neutral-600'}`}>
                                    {includePending && <CheckSquare size={8} className="text-black" />}
                                </div>
                                <input type="checkbox" checked={includePending} onChange={e => setIncludePending(e.target.checked)} className="hidden" />
                                <span className={`text-sm ${includePending ? 'text-white' : 'text-neutral-400'}`}>Work in Progress</span>
                            </label>
                            
                            <label className="flex items-center gap-2 p-2 border border-neutral-800 bg-black cursor-pointer hover:border-neutral-600 transition-colors">
                                <div className={`w-3 h-3 border flex items-center justify-center ${includeFinancials ? 'bg-white border-white' : 'border-neutral-600'}`}>
                                    {includeFinancials && <CheckSquare size={8} className="text-black" />}
                                </div>
                                <input type="checkbox" checked={includeFinancials} onChange={e => setIncludeFinancials(e.target.checked)} className="hidden" />
                                <span className={`text-sm ${includeFinancials ? 'text-white' : 'text-neutral-400'}`}>Client Expenditure (Pie Chart)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                       <div className="flex justify-between items-center mb-2">
                           <label className="text-xs text-neutral-500 uppercase font-mono">Executive Summary</label>
                           <button 
                              onClick={handleGenerateSummary} 
                              disabled={isGeneratingSummary}
                              className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              {isGeneratingSummary ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                              GENERATE WITH AI
                           </button>
                       </div>
                       <textarea 
                           value={reportNote}
                           onChange={e => setReportNote(e.target.value)}
                           className="w-full h-32 bg-black border border-neutral-800 text-neutral-300 p-3 text-xs font-mono focus:outline-none focus:border-white resize-none leading-relaxed"
                           placeholder="Enter a custom message..."
                       />
                    </div>
                 </div>

                 <div className="mt-auto pt-6">
                    <button 
                       onClick={handlePrintPDF}
                       className="w-full bg-white text-black py-3 text-sm font-bold hover:bg-neutral-200 flex items-center justify-center gap-2 transition-colors"
                    >
                       <Printer size={16} /> GENERATE PDF
                    </button>
                 </div>
             </div>

             {/* Right: Live Preview */}
             <div className="flex-1 bg-neutral-800 p-8 overflow-y-auto flex justify-center relative">
                 <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-xs text-white backdrop-blur z-10">
                     LIVE PREVIEW
                 </div>
                 
                 {/* Paper Sheet */}
                 <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl text-black p-[15mm] box-border transform scale-[0.85] origin-top transition-all">
                     
                     {/* Header */}
                     <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
                         <div>
                             <div className="inline-block bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-[2px] mb-2">2ndBrain CRM</div>
                             <h1 className="text-4xl font-extrabold tracking-tight uppercase text-black m-0 leading-none">Progress Report</h1>
                         </div>
                         <div className="text-right text-[10px] font-mono text-neutral-600 leading-tight">
                             DATE: {reportDate}<br />
                             REF: {Date.now().toString().slice(-6)}
                         </div>
                     </div>

                     {/* 2 Column Grid */}
                     <div className="grid grid-cols-2 gap-8 mb-8">
                         
                         {/* Col 1: Executive Summary */}
                         <div className="bg-neutral-50 p-5 border-l-4 border-black">
                             <h3 className="text-[10px] font-bold uppercase text-neutral-500 mb-3 tracking-widest">Executive Summary</h3>
                             <div className="text-xs leading-relaxed whitespace-pre-wrap">
                                 {reportNote || 'No summary provided.'}
                             </div>
                         </div>

                         {/* Col 2: Financials / Metrics */}
                         {includeFinancials && (
                            <div className="bg-neutral-50 p-5 border-l-4 border-neutral-600 flex flex-col">
                                <h3 className="text-[10px] font-bold uppercase text-neutral-500 mb-3 tracking-widest">Workload Analysis</h3>
                                
                                <div className="flex justify-between border-b border-neutral-200 pb-1 mb-2 text-xs">
                                    <span className="text-neutral-500">Daily Output</span>
                                    <span className="font-bold">{currency}{reportTasks.completed.reduce((acc, t) => acc + (t.isBillable ? t.amount : 0), 0).toFixed(2)}</span>
                                </div>
                                
                                {/* Pie Chart Preview (Client Expenditure) */}
                                {(() => {
                                    const clientData = getClientValueDistribution();
                                    if (clientData.length > 0) {
                                        return (
                                            <div className="flex items-center gap-4 mt-auto pt-4">
                                                <div dangerouslySetInnerHTML={{__html: generatePieChartSVG(clientData, 60)}} />
                                                <div className="flex-1">
                                                    <div className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Client Expenditure (Total)</div>
                                                    <div className="space-y-1">
                                                        {clientData.slice(0, 3).map(d => (
                                                            <div key={d.name} className="flex justify-between text-[9px]">
                                                                <div className="flex items-center gap-1">
                                                                    <span style={{background: d.color}} className="w-1.5 h-1.5 rounded-full inline-block"></span>
                                                                    <span className="truncate max-w-[80px]">{d.name}</span>
                                                                </div>
                                                                <span className="font-mono">{currency}{d.value.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return <div className="text-[9px] text-neutral-400 italic mt-4">No client value data available.</div>;
                                })()}
                            </div>
                         )}
                     </div>

                     {/* Project Section */}
                     <div className="border-b-2 border-black mb-6 pb-1">
                        <h3 className="text-base font-extrabold uppercase m-0">Project Activity</h3>
                     </div>

                     {Object.keys(reportTasks.completed).length === 0 && Object.keys(reportTasks.pending).length === 0 && (
                         <div className="text-center py-12 text-neutral-400 italic text-xs">
                             No matching tasks found for this date.
                         </div>
                     )}

                     {/* Projects Loop */}
                     {(() => {
                        const tasksByProject: Record<string, { completed: Task[], pending: Task[] }> = {};
                        reportProjectIds.forEach(pid => {
                            const comp = reportTasks.completed.filter(t => t.projectId === pid);
                            const pend = reportTasks.pending.filter(t => t.projectId === pid);
                            if (comp.length > 0 || pend.length > 0) {
                                tasksByProject[pid] = { completed: comp, pending: pend };
                            }
                        });

                        return Object.keys(tasksByProject).map(pid => {
                            const proj = projects.find(p => p.id === pid);
                            const { completed, pending } = tasksByProject[pid];
                            return (
                                <div key={pid} className="mb-6 break-inside-avoid">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-bold text-sm uppercase m-0">{proj?.name}</h4>
                                        <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 uppercase">{proj?.clientName}</span>
                                    </div>
                                    
                                    <div className="border-t border-neutral-100">
                                        {completed.map(t => (
                                            <div key={t.id} className="flex justify-between text-xs py-1 border-b border-neutral-100">
                                                <div className="flex items-start gap-2">
                                                    <span className="font-bold text-black">✓</span>
                                                    <span>{t.title}</span>
                                                </div>
                                                {t.isBillable && <span className="font-bold">{currency}{t.amount.toFixed(2)}</span>}
                                            </div>
                                        ))}
                                        {pending.map(t => (
                                            <div key={t.id} className="flex justify-between text-xs py-1 text-neutral-500 border-b border-neutral-50">
                                                <div className="flex items-center gap-2 italic">
                                                    <span className="text-[9px]">○</span>
                                                    <span>{t.title}</span>
                                                </div>
                                                <span className="text-[9px]">PENDING</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                     })()}

                     {/* Footer */}
                     <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] text-center text-[9px] text-neutral-400 uppercase font-mono tracking-widest">
                         Confidential • Generated by 2ndBrain System • {new Date().getFullYear()}
                     </div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectForm && (
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-light">New Project</h3>
                  <button onClick={() => setShowProjectForm(false)} className="text-neutral-500 hover:text-white"><X size={20}/></button>
               </div>
               <form onSubmit={handleAddProject} className="space-y-4">
                  <div>
                     <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Project Name</label>
                     <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" required autoFocus />
                  </div>
                  <div>
                     <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Client / Company</label>
                     <input type="text" value={newProjectClient} onChange={e => setNewProjectClient(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" required />
                  </div>
                  <div>
                     <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Deadline</label>
                     <input type="date" value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" />
                  </div>
                  <button type="submit" className="w-full bg-white text-black py-3 text-sm font-bold hover:bg-neutral-200 mt-4">CREATE PROJECT</button>
               </form>
            </div>
         </div>
      )}

      {/* Add Task Modal */}
      {showTaskForm && (
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-light">Add Task</h3>
                  <button onClick={() => setShowTaskForm(false)} className="text-neutral-500 hover:text-white"><X size={20}/></button>
               </div>
               <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                     <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Task Title</label>
                     <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" required autoFocus />
                  </div>
                  <div className="flex items-center gap-2 border border-neutral-800 p-3 bg-black cursor-pointer" onClick={() => setNewTaskBillable(!newTaskBillable)}>
                     <div className={`w-4 h-4 border flex items-center justify-center ${newTaskBillable ? 'bg-green-500 border-green-500' : 'border-neutral-600'}`}>
                        {newTaskBillable && <CheckSquare size={10} className="text-black" />}
                     </div>
                     <span className="text-sm text-neutral-300">Chargeable / Billable</span>
                  </div>
                  {newTaskBillable && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Amount ({currency})</label>
                        <input type="number" value={newTaskAmount} onChange={e => setNewTaskAmount(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" placeholder="0.00" />
                     </div>
                  )}
                  <button type="submit" className="w-full bg-white text-black py-3 text-sm font-bold hover:bg-neutral-200 mt-4">ADD TASK</button>
               </form>
            </div>
         </div>
      )}

      {/* Add Contact Modal */}
      {showContactForm && (
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-light">Add New Contact</h3>
                     <button onClick={() => setShowContactForm(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleAddContact} className="space-y-4">
                     <div>
                         <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Name</label>
                         <input type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" required />
                     </div>
                     <div>
                         <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Role</label>
                         <input type="text" value={newContactRole} onChange={e => setNewContactRole(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" />
                     </div>
                     <div>
                         <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Company</label>
                         <input type="text" value={newContactCompany} onChange={e => setNewContactCompany(e.target.value)} className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white" />
                     </div>
                     <button type="submit" className="w-full bg-white text-black py-3 text-sm font-bold mt-4 hover:bg-neutral-200">SAVE CONTACT</button>
                 </form>
             </div>
         </div>
      )}

    </div>
  );
};

export default CRM;
