import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CreditCard, DollarSign, Plus, Minus, ArrowDownLeft, ArrowUpRight, X, Wallet as WalletIcon, Building2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { dataManager } from '../../services/dataManager';
import { Transaction, Card } from '../../types';

const Wallet: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Manual Entry State
  const [showTxForm, setShowTxForm] = useState(false);
  const [newTxType, setNewTxType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  // Add Card State
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardBalance, setNewCardBalance] = useState('');
  const [newCardType, setNewCardType] = useState<'credit'|'debit'|'cash'>('debit');
  const [newCardColor, setNewCardColor] = useState('from-zinc-800 to-zinc-900');
  const [newCardExcluded, setNewCardExcluded] = useState(false);

  useEffect(() => {
    const updateWallet = () => {
      const txs = dataManager.getTransactions();
      const fetchedCards = dataManager.getCards();
      
      setTransactions(txs);
      setCards(fetchedCards);
      setBalance(dataManager.getNetWorth());
      setCurrencySymbol(dataManager.getCurrencySymbol());

      // Set default selection for transaction modal
      if (fetchedCards.length > 0 && !selectedCardId) {
        setSelectedCardId(fetchedCards[0].id);
      } else if (fetchedCards.length === 0) {
        setSelectedCardId('');
      }
      
      // Calculate totals from transactions
      let totalIncome = 0;
      let totalExpense = 0;
      txs.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
      });
      setIncome(totalIncome);
      setExpense(totalExpense);

      // Generate Chart Data based on ACTUAL history
      setChartData(dataManager.getBalanceHistory(7));
    };

    updateWallet();
    return dataManager.subscribe(updateWallet);
  }, [selectedCardId, balance]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    
    if (!selectedCardId && cards.length > 0) {
        // Fallback safety
        setSelectedCardId(cards[0].id);
    }

    dataManager.updateWallet(parseFloat(amount), newTxType, description, selectedCardId);
    setAmount('');
    setDescription('');
    setShowTxForm(false);
  };

  const handleDeleteTransaction = (id: string) => {
      if (confirm("Are you sure you want to delete this transaction? The amount will be reverted to the card balance.")) {
          dataManager.deleteTransaction(id);
      }
  };

  const handleAddCard = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCardName || !newCardBalance) return;

      dataManager.addCard({
          name: newCardName,
          bank: newCardBank || 'N/A',
          balance: parseFloat(newCardBalance),
          type: newCardType,
          last4: Math.floor(1000 + Math.random() * 9000).toString(),
          theme: newCardColor,
          excludeFromTotals: newCardExcluded
      });

      // Reset
      setNewCardName('');
      setNewCardBank('');
      setNewCardBalance('');
      setNewCardExcluded(false);
      setShowCardForm(false);
  };

  const handleDeleteCard = (id: string) => {
      if(confirm("Delete this account? Transactions history will remain but unlink.")) {
          dataManager.deleteCard(id);
          if (selectedCardId === id) setSelectedCardId('');
      }
  }

  const toggleCardExclusion = (card: Card) => {
    dataManager.updateCard({
        ...card,
        excludeFromTotals: !card.excludeFromTotals
    });
  };

  const getCardName = (id?: string) => {
      const card = cards.find(c => c.id === id);
      return card ? card.name : 'Unknown Account';
  }

  return (
    <div className="p-8 pb-32 space-y-8 relative h-full flex flex-col">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light">Assets & Liquidity</h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => { setNewTxType('income'); setShowTxForm(true); }}
                    disabled={cards.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 text-sm hover:border-green-500 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={14} /> Income
                </button>
                <button 
                    onClick={() => { setNewTxType('expense'); setShowTxForm(true); }}
                    disabled={cards.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 text-sm hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Minus size={14} /> Expense
                </button>
            </div>
        </div>

        {/* Cards Scroll Section */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500">Accounts</h3>
                <button onClick={() => setShowCardForm(true)} className="text-xs border border-neutral-800 px-2 py-1 hover:bg-white hover:text-black transition-colors flex items-center gap-1">
                    <Plus size={12} /> ADD CARD
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[180px]">
                {cards.map(card => (
                    <div 
                        key={card.id} 
                        className={`min-w-[280px] h-[160px] rounded-xl p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${card.theme} border border-white/10 group transition-all hover:scale-[1.02] shrink-0`}
                    >
                        {/* Visibility Toggle */}
                        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleCardExclusion(card); }}
                                className="text-white/50 hover:text-white transition-colors"
                                title={card.excludeFromTotals ? "Include in Net Worth" : "Exclude from Net Worth"}
                            >
                                {card.excludeFromTotals ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                                className="text-white/50 hover:text-red-400 transition-colors"
                                title="Delete Account"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-xs font-mono text-white/60 uppercase">{card.bank}</p>
                                <p className="font-bold text-white tracking-wide">{card.name}</p>
                            </div>
                            <div className="mr-16"> {/* Spacer for icons */}
                                <CreditCard size={18} className="text-white/40" />
                            </div>
                        </div>
                        <div className={`z-10 ${card.excludeFromTotals ? 'opacity-50' : ''}`}>
                            <p className="text-2xl font-bold text-white">
                                {card.excludeFromTotals ? '---' : `${currencySymbol}${card.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </p>
                            <p className="text-[10px] font-mono text-white/40 mt-1">
                                **** **** **** {card.last4} {card.excludeFromTotals && '(EXCLUDED)'}
                            </p>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
                        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-black/20 blur-2xl"></div>
                    </div>
                ))}
                
                {/* Empty State Card */}
                {cards.length === 0 && (
                     <button onClick={() => setShowCardForm(true)} className="min-w-[280px] h-[160px] rounded-xl border border-neutral-800 border-dashed flex flex-col items-center justify-center text-neutral-600 gap-2 hover:border-white hover:text-white transition-colors">
                        <CreditCard size={24} />
                        <span className="text-xs">Add your first account</span>
                     </button>
                )}
            </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 p-6 border border-neutral-800 relative overflow-hidden">
                <div className="flex items-center gap-2 text-neutral-500 mb-2 font-mono text-xs uppercase z-10 relative">
                    <DollarSign size={14} /> Net Worth
                </div>
                <div className={`text-3xl font-bold z-10 relative text-white`}>
                    {currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            
            <div className="bg-neutral-900 p-6 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-500 mb-2 font-mono text-xs uppercase">
                    <ArrowUpRight size={14} /> Total Income
                </div>
                <div className="text-3xl font-bold text-green-500">
                    +{currencySymbol}{income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            
            <div className="bg-neutral-900 p-6 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-500 mb-2 font-mono text-xs uppercase">
                    <ArrowDownLeft size={14} /> Total Expenses
                </div>
                <div className="text-3xl font-bold text-red-500">
                    -{currencySymbol}{expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          {/* Chart */}
          <div className="lg:col-span-2 border border-neutral-800 p-6 bg-black flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500">Net Worth Trend</h3>
                <span className="text-xs px-2 py-1 bg-neutral-900 text-neutral-400 rounded">7 Days</span>
              </div>
              <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                          <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#fff" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#333" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                          <YAxis stroke="#333" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }} />
                          <Area type="monotone" dataKey="amount" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Recent Transaction List */}
          <div className="border border-neutral-800 p-0 bg-black flex flex-col h-full overflow-hidden">
             <div className="p-6 border-b border-neutral-800">
                <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500">Recent Activity</h3>
             </div>
             <div className="overflow-y-auto flex-1 p-0">
                {transactions.length === 0 ? (
                    <div className="p-6 text-neutral-600 text-sm italic text-center">No transactions recorded.</div>
                ) : (
                    <div className="divide-y divide-neutral-900">
                        {transactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-neutral-900/50 transition-colors group relative">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{tx.description}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase font-mono">
                                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                                        {tx.cardId && (
                                            <>
                                            <span>•</span>
                                            <span className="text-neutral-400">{getCardName(tx.cardId)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`font-mono text-sm font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <button 
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Transaction"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showTxForm && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-light">Record {newTxType === 'income' ? 'Income' : 'Expense'}</h3>
                        <button onClick={() => setShowTxForm(false)} className="text-neutral-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Account</label>
                            <select 
                                value={selectedCardId}
                                onChange={(e) => setSelectedCardId(e.target.value)}
                                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 text-sm focus:outline-none focus:border-white"
                            >
                                {cards.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.bank}) - {currencySymbol}{c.balance}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-white">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-black border border-neutral-800 text-white pl-8 pr-4 py-2 focus:outline-none focus:border-white transition-colors"
                                    placeholder="0.00"
                                    autoFocus
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Description</label>
                            <input 
                                type="text" 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white transition-colors"
                                placeholder={newTxType === 'income' ? "e.g. Client Invoice" : "e.g. Office Supplies"}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className={`w-full py-3 font-bold text-sm mt-4 transition-colors ${
                                newTxType === 'income' 
                                ? 'bg-green-600 hover:bg-green-500 text-white' 
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                        >
                            CONFIRM TRANSACTION
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Add Card Modal */}
        {showCardForm && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-light">Add New Account</h3>
                        <button onClick={() => setShowCardForm(false)} className="text-neutral-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddCard} className="space-y-4">
                        <div>
                             <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Account Type</label>
                             <div className="flex gap-2">
                                 {(['debit', 'credit', 'cash'] as const).map(t => (
                                     <button
                                        key={t}
                                        type="button"
                                        onClick={() => setNewCardType(t)}
                                        className={`flex-1 py-2 text-xs uppercase border ${newCardType === t ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                                     >
                                         {t}
                                     </button>
                                 ))}
                             </div>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Account Name</label>
                            <input 
                                type="text" 
                                value={newCardName}
                                onChange={e => setNewCardName(e.target.value)}
                                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white"
                                placeholder="e.g. Main Checking"
                            />
                        </div>
                        {newCardType !== 'cash' && (
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Bank Name</label>
                            <input 
                                type="text" 
                                value={newCardBank}
                                onChange={e => setNewCardBank(e.target.value)}
                                className="w-full bg-black border border-neutral-800 text-white px-4 py-2 focus:outline-none focus:border-white"
                                placeholder="e.g. Chase"
                            />
                        </div>
                        )}
                        <div>
                            <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Initial Balance</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-white">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    value={newCardBalance}
                                    onChange={e => setNewCardBalance(e.target.value)}
                                    className="w-full bg-black border border-neutral-800 text-white pl-8 pr-4 py-2 focus:outline-none focus:border-white transition-colors"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-neutral-500 uppercase font-mono block mb-2">Card Style</label>
                             <div className="flex gap-2">
                                 <button type="button" onClick={() => setNewCardColor('from-zinc-800 to-zinc-900')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 ${newCardColor.includes('zinc') ? 'ring-2 ring-white' : ''}`}></button>
                                 <button type="button" onClick={() => setNewCardColor('from-blue-900 to-blue-950')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 ${newCardColor.includes('blue') ? 'ring-2 ring-white' : ''}`}></button>
                                 <button type="button" onClick={() => setNewCardColor('from-purple-900 to-purple-950')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-900 to-purple-950 ${newCardColor.includes('purple') ? 'ring-2 ring-white' : ''}`}></button>
                                 <button type="button" onClick={() => setNewCardColor('from-emerald-900 to-emerald-950')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-950 ${newCardColor.includes('emerald') ? 'ring-2 ring-white' : ''}`}></button>
                             </div>
                        </div>
                        
                        <div className="pt-2">
                             <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                                 <input 
                                     type="checkbox" 
                                     checked={newCardExcluded} 
                                     onChange={(e) => setNewCardExcluded(e.target.checked)} 
                                     className="rounded bg-neutral-800 border-neutral-700 text-white focus:ring-0"
                                 />
                                 Exclude from Total Net Worth
                             </label>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 font-bold text-sm mt-4 bg-white text-black hover:bg-neutral-200 transition-colors"
                        >
                            CREATE ACCOUNT
                        </button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};

export default Wallet;