require('dotenv').config();

  const { GoogleGenAI } = require('@google/genai');
  
  async function main() {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const tools = [
      {
        googleSearch: {
        }
      },
    ];
    const config = {
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
      tools,
    };
    const model = 'gemini-3-pro-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `extract the order data and give output as RAW json without markdown code blocks, backticks, or any preamble/postscript: hello
 so it's not talking back
 if we're getting a little bit down I would like to order a pizza
 have you certainly
 so sorry I didn't quite catch that
 I would like to order a pizza
 I understand what kind of pizza would you like to order today
 I want a huge
 pizza with
 chicken breast and broccoli and some sprinkles of cheddar cheese
 and garlic oil on top of coal
 maybe the cross should be stuffed with cheese
 that's it
that sounds lovely we have chicken supreme and Caribbean Chicken Lovers pizzas with chicken for a large size and cheesy crust those would be 20 euros 90 cents for Texas Supreme or 18 Euros 90 for the other chicken options we don't have broccoli cheddar or garlic oil specifically as toppings but which of the chicken pizzas would you prefer
 the one with
 cheddar broccoli and garlic oil
 I mentioned we don't have those specific topics the closest options are chicken supreme Caribbean Chicken Lovers or Texas Supreme they all come with cheesy crust if you like which one would you like to order
 can you tell me what on the
 Caribbean
 the Caribbean Chicken Lovers includes chicken and pineapple giving it a tropical flavor a large with cheesy crust is 1890 does that sound good
know that sounds like a biological weapon then I will just take the chicken meat lovers
 no problem in that case would you like the chicken supreme or Texas Supreme and would you still like a large with cheesy crust
 yes and the chicken supreme please
 great so that's one large chicken supreme with cheesy crust for 1890 is there anything else you'd like to add perhaps a drink
 do you have chicken fingers
 I'm afraid we don't have chicken fingers you can see the drinks menu if you're interested in a beverage
 yes I want Canada Dry
 we don't have Canada Dry but we do have Pepsi Pepsi Zero 7-Up Lipton iced tea Peach and mineral water and point five leader or 1.5 liter bottles are you interested in any of those
7 up please
 sure what size would you like for the 7Up 0.5 liter or 1.5 liter
 I have a lot of pizzas so I will take the large size
 perfect so that's one large 1.5 liter 7 Up for four dollars fifty cents to confirm your order is one large chicken supreme with cheesy crust for 1890 and 1 large 7Up for four dollars and fifty cents is that correct
 that sounds great
 perfect now for the delivery could you get your name delivery address and a phone number
 it has to be delivered to range 501
 in
 got it ringstrasse 51 in compass and could I have your name and contact phone number please
Max mustermann
 the people here
 thank you Max Mastermind and a phone number please
 oh that's what I feel from sexy
 thank you your order will be delivered to ringstrasse 51 and Kellen pass the total is 23 Euros 40 cents it should be with you in about 30 to 40 minutes is there anything else I can help you with
 no I think that's it
 thank you for your order and join your reel
 thank you
 you're welcome have a great day
 bye
 bye`,
          },
        ],
      },
    ];
  
    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    console.log(JSON.parse(response.text));
  }
  
  main();
  