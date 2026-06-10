using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Utilities;
using System.Text.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsXsollaPaymentCallback;

public class Function
{

    /// <summary>
    /// This function processes the Xsolla Payment Callback
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        var authorization = proxyRequest.Headers["Authorization"];



        return ThousandsResponse("Success", 200);
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, int statusCode = 500)
    {
        Console.WriteLine($"ThousandsResponse: {message}");
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = "",
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
