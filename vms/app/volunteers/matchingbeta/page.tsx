'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import BookingModal from '@/app/volunteers/components/BookingModal'

interface Match {
    rank: number
    volunteer_id: number
    match_score: number
    reasoning: string
    name: string
    email: string
    phone: string
}

export default function MatchPage() {
    const { data: session } = useSession()
    const [request, setRequest] = useState('')
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(false)
    const [rebuilding, setRebuilding] = useState(false)
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')

    // Implementing booking modal
    const [bookingVolunteer, setBookingVolunteer] = useState<Match | null>(null)

    const token = (session as any)?.accessToken;

    // Moved token check inside useEffect to check token once session loads, avoiding loops
    useEffect(() => {
        if (session && !token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }
    }, [session, token])

    // handling matching functionality
    const handleMatch = async () => {
        if (!request.trim()) return
        setLoading(true)
        setError('')
        setMatches([])

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/matchingbeta/match-volunteers/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ request }),
                }
            )

            if (!response.ok) throw new Error('Failed to fetch matches')

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            if (!reader) throw new Error('No response body')

            // attempting to stream match results as they are received
            let buffer = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))
                            if (data.match) setMatches(prev => [...prev, data.match])
                            if (data.error) setError(data.error)
                        } catch { }
                    }
                }
            }
        } catch {
            setError('Something went wrong, please try again')
        } finally {
            setLoading(false)
        }
    }

    // Handling rebuild embedding buttons
    const handleRebuild = async (rebuild_all: boolean) => {
        setRebuilding(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/matchingbeta/rebuild-embeddings/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ rebuild_all })
                }
            )
            const data = await response.json()
            alert(
                `Rebuild complete!\n` +
                `Success: ${data.success}\n` +
                `Skipped: ${data.skipped}\n` +
                `Failed: ${data.failed}`
            )
        } catch {
            alert('Rebuild failed')
        } finally {
            setRebuilding(false)
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-4">
            <div className="flex justify-between mb-8">
                <h1 className="page-header">AI Volunteer Matching - *BETA!*</h1>

                {/* rebuild embedding buttons */}
                <div className="flex gap-1">
                    <button
                        onClick={() => handleRebuild(false)}
                        disabled={rebuilding}
                        className="border border-orange-300 hover:border-orange-400 disabled:opacity-50 text-orange-600 px-4 py-2 rounded-lg text-sm hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                        {rebuilding ? 'Rebuilding...' : 'Rebuild Missing'}
                    </button>
                    <button
                        onClick={() => handleRebuild(true)}
                        disabled={rebuilding}
                        className="border border-green-400 hover:border-green-600 disabled:opacity-50 text-green-600 px-4 py-2 rounded-lg text-sm  hover:bg-green-100 transition-colors cursor-pointer"
                    >
                        {rebuilding ? 'Rebuilding...' : 'Rebuild All'}
                    </button>
                </div>
            </div>

            {/* Beta feature message with optional drop down for note review */}
            <div className="gap-1 mb-5">
                <h2
                    onClick={() => setOpen(!open)}
                    className="flex text-primary opacity-69 font-bold italic space-y-1">
                    *This feature is experimental and is currently under development. <br /> 
                    Please click this message to review notes for the best experience.* 
                    {open ? < ChevronUp className="w-9 h-9"/> : < ChevronDown className="w-9 h-9"/>}
                </h2>
                {open && (
                    <ul className="list-disc list-inside space-y-2 pl-4 text-gray-500">
                        <li>There are 2 buttons on the top right of this page: <span className='text-orange-600 font-semibold'>Rebuild Missing</span> and <span className='text-green-600 font-semibold'>Rebuild All</span>.</li>
                        <ul className="list-decimal list-inside space-y-1 pl-6 mt-1 text-gray-500">
                            <li><span className='text-orange-600 font-semibold'>Rebuild Missing</span> ensures any newly added volunteer profiles are accounted for in the feature.</li>
                            <li><span className='text-green-600 font-semibold'>Rebuild All</span> ensures all existing volunteer profiles and all (if any) recent changes to them are accounted for in the feature.</li>
                        </ul>
                        <li>Before using this feature, it is recommended to press the <span className='text-green-600 font-semibold'>Rebuild All</span> button in order to provide the best matches.</li>
                        <li>Otherwise, using this feature is very straightforward - simply write a description of your ideal volunteer candidate in the text box (e.g. I need a volunteer that ...) and click <span className='text-primary font-semibold'>Find Matches</span> to find the best matches!</li>
                        <li>If you recieve a <span className='font-semibold'>"Rebuild failed"</span> or <span className='font-semibold'>"Rebuild Complete! Success: 0, Skipped: 0, Failed: 3 (or number of volunteers)"</span> popup when using the rebuild buttons <span className='font-bold'>AND</span> a <span className='text-red-700 font-semibold'>"name 'UserEmbedding' is not defined"</span> or <span className='text-red-700 font-semibold'>"Something went wrong, please try again"</span> error when using the feature, this feature may not have been enabled. Please contact your IT administrator.</li>
                    </ul>
                )}
                
            </div>

            <h2 className="section-header mb-6">What volunteer are you looking for today?</h2>
            <div className="flex gap-3 mb-8">
                <textarea
                    value={request}
                    onChange={e => setRequest(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleMatch()
                        }
                    }}
                    placeholder="Describe your ideal volunteer qualities here"
                    rows={1}
                    className="login-fields"
                    style={{ minHeight: '48px' }}
                    onInput={e => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = `${target.scrollHeight}px`
                    }}
                />
                <button
                    onClick={handleMatch}
                    disabled={loading || !request.trim()}
                    className="btn-primary w-sm"
                >
                    {loading ? 'Searching...' : 'Find Matches'}
                </button>
            </div>

            {/* display error messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* loading placeholder when waiting for results */}
            {loading && matches.length === 0 && (
                <p className="text-center py-16 text-gray-500 animate-pulse">
                    Finding best matches...
                </p>
            )}

            {/* placeholder for results when opening page */}
            {!loading && matches.length === 0 && !error && (
                <p className="text-center py-16 text-gray-500">
                    Enter a request above to find matching volunteers
                </p>
            )}

            {/* showing top 5 results */}
            <div className="space-y-3">
                {matches.map(match => (
                    <div key={match.volunteer_id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">

                        {/* heading row for each match */}
                        <div className="flex items-center justify-between px-5 py-4 bg-white">

                            {/* displaying volunteer identification data for clarity */}
                            <div className="flex items-center gap-4">
                                <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                                    {match.rank}
                                </span>
                                <div>
                                    <p className="font-medium text-gray-900">{match.name}</p>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-sm text-gray-500">{match.email}</p>
                                        <p className="text-sm text-gray-500">{match.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* displaying rank in best fit % and booking button to schedule visit */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    {match.match_score}% match
                                </span>
                               <button
                                    onClick={() => setBookingVolunteer(match)}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                                >
                                    Book
                                </button>
                            </div>
                        </div>

                        {/* displaying reasoning for each match */}
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Reasoning</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{match.reasoning}</p>
                        </div>

                    </div>
                ))}
            </div>

            {/* enabling booking functionality for each match */}
            {bookingVolunteer && (
                <BookingModal
                    volunteerId={bookingVolunteer.volunteer_id}
                    volunteerName={bookingVolunteer.name}
                    onClose={() => setBookingVolunteer(null)}
                    // Ensuring booking modal confirmation screen is shown
                    onSuccess={() => {}}
                />
            )}

        </div>
    )
}