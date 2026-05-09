/** Public Facebook Page reviews tab — for “Reviews from Facebook” link. */
export const FACEBOOK_REVIEWS_URL =
  'https://www.facebook.com/risingstarfishgaming/reviews/?id=100083488932514&sk=reviews'

export type FacebookRecommendReview = {
  name: string
  quote: string
}

/** “Recommends” reviews only — suitable for the home page carousel. */
export const facebookRecommendReviews: FacebookRecommendReview[] = [
  {
    name: 'Hayven Rarig',
    quote:
      'awesome service and great staff. quick to respond and very friendly highly recommend',
  },
  {
    name: 'Tanya Tinsley',
    quote:
      "FAST AND FRIENDLY CUSTOMER SUPPORT 100% ALL YOUR FAVORITE PLATFORMS LOT'S OF FUN GOOD PLACE TO PLAY",
  },
  {
    name: 'Steven Merino',
    quote: 'AMAZING CUSTOMER SERVICE AND GREAT GAMES COME CHECK THEM OUT! 💯',
  },
  {
    name: 'Junior Scroggins',
    quote:
      'highly recommend! very courteous and respectful, and they got all the platforms you\'ll want to play. diverse and authentic and about their clients...why play anywhere else when you have what you need right here',
  },
  {
    name: 'Michael Lauren',
    quote: 'Awesome gaming you guys thanks',
  },
  {
    name: 'Jeff Wood',
    quote: "it's the place to be!!!!!!!!!",
  },
  {
    name: 'Bradley Tanya Craft',
    quote: 'Great gaming group and great customer service.',
  },
  {
    name: 'Zach Grove',
    quote: 'Best in the business! Only sponsors to have!',
  },
]
