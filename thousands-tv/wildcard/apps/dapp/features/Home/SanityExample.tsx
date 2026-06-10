'use client'

import { useEffect, useState } from 'react'
import { client, urlFor } from '@/sanity.client'
import PortableTextRenderer from '@/components/PortableTextRenderer'

interface RallyPrediction {
    _id: string
    title: string
    slug: { current: string }
    publishedAt: string
    headerBanner?: any
    smallBanner?: any
    shortDescription?: string
    longDescription?: any[]
}

export const SanityExample = () => {
    const [prediction, setPrediction] = useState<RallyPrediction | null>(null)
    const [loading, setLoading] = useState(true) // boolean for loading state

    //Fetch predictions from Sanity
    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const query = `*[_type == "rallyPredictionDetail" && _id == $predictionId][0] {
          _id,
          title,
          slug,
          publishedAt,
          headerBanner,
          smallBanner,
          shortDescription,
          longDescription
        }`

                const data = await client.fetch(query, { predictionId: "66edf46e-4010-42c0-ba74-5d8bac525bca" })
                console.log('Fetched rally prediction:', data)
                setPrediction(data)
            } catch (error) {
                console.error('Error fetching rally prediction:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPredictions()
    }, [])

    if (loading) {
        return <div className="text-center p-8">Loading rally prediction...</div>
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Rally Prediction Detail</h1>

            {prediction?.longDescription && (
                <div className="mt-6">
                    <PortableTextRenderer content={prediction.longDescription} />
                </div>
            )}
        </div>
    )
}
