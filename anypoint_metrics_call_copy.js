const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

const config = {
    client_id: process.env.METRICS_CLIENT_ID,
    client_secret: process.env.METRICS_CLIENT_SECRET,
    token_url: 'https://anypoint.mulesoft.com/accounts/api/v2/oauth2/token',
    api_base_url: 'https://anypoint.mulesoft.com',
    api_query_time_duration: 'from/now-1d/to/now',
    organizationId: process.env.ANYPOINT_ORGANIZATION_ID, // Replace with your organization ID
    environmentId: process.env.ANYPOINT_ENVIRONMENT_ID,
    environment: process.env.ANYPOINT_ENVIRONMENT,
};

let accessToken = null;
let appReportMetricsArray = []; // Declare appReportMetricsArray globally


async function getAccessToken() {
    try {
        const response = await axios.post(
            config.token_url,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: config.client_id,
                client_secret: config.client_secret
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        accessToken = response.data.access_token;
        console.log('Access token retrieved.');

    } catch (error) {
        console.error('Error retrieving access token:', error.response?.data || error.message);
    }
}


// create a function to call Reqeust Volume endpoint
// https://anypoint.mulesoft.com/monitoring/api/organizations/{{organization_id}}/environments/{{environment_id}}/reports/request-volume/from/now-1d/to/now
async function callRequestVolumeEndpoint() {
    if (!accessToken) {
        await getAccessToken();
    }
    const endpointPath = `/monitoring/api/organizations/${config.organizationId}/environments/${config.environmentId}/reports/requests/${config.api_query_time_duration}`;

    try {
        const response = await axios.get(`${config.api_base_url}${endpointPath}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        // console.log(response.data);

        // create a new varaible to hold the response data, so that it can be ordered by appId
        const orderedResponseData = response.data.applicationData.sort((a, b) => a.appId.localeCompare(b.appId));
        // console.log('Ordered Response Data:', orderedResponseData);

        // loop through the response data a print to console
        orderedResponseData.forEach(item => {

            // creat new AppReportMetrics object ofr each item and push to appReportMetricsArray
            appReportMetricsArray.push(new AppReportMetrics(
                item.orgName,
                item.envName,
                item.appId,
                item.requestVolume,
                item.successfulRequests,
                item.failedRequests,
                item.responseTime,
                item.cpuUtilization,
                item.memoryPressure,
                item.memoryUtilization,
                item.totalMemory
            ));
        });

        console.log('App Report Metrics Array:', appReportMetricsArray);

    } catch (error) {
        console.error('Error calling API:', error.response?.data || error.message);
    }
}

// create a function to call the Performance endpoint
// https://anypoint.mulesoft.com/monitoring/api/organizations/{{organization_id}}/environments/{{environment_id}}/reports/performance/from/now-1d/to/now
async function callPerformanceEndpoint() {
    if (!accessToken) {
        await getAccessToken();
    }

    const endpointPath = `/monitoring/api/organizations/${config.organizationId}/environments/${config.environmentId}/reports/performance/${config.api_query_time_duration}`;

    try {
        const response = await axios.get(`${config.api_base_url}${endpointPath}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        console.log(response.data);

        // 
        response.data.applicationData.forEach(item => {
            // For the response data, loop though the appReportMetricsArray and match the appId, them update the object with the reponse data responseTime
            const appReportMetrics = appReportMetricsArray.find(app => app.appId === item.appId);
            if (appReportMetrics) {
                appReportMetrics.responseTime = parseFloat(item.responseTime).toFixed(2);
            }
        });
        console.log('App Report Metrics Array:', appReportMetricsArray);


    } catch (error) {
        console.error('Error calling API:', error.response?.data || error.message);
    }
}

// create a funciton to call the failures endpoint
// https://anypoint.mulesoft.com/monitoring/api/organizations/{{organization_id}}/environments/{{environment_id}}/reports/failures/from/now-1d/to/now
async function callFailuresEndpoint() {
    if (!accessToken) {
        await getAccessToken();
    }

    const endpointPath = `/monitoring/api/organizations/${config.organizationId}/environments/${config.environmentId}/reports/failures/${config.api_query_time_duration}`;

    try {
        const response = await axios.get(`${config.api_base_url}${endpointPath}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        console.log(response.data);

        response.data.applicationData.forEach(item => {
            // For the response data, loop though the appReportMetricsArray and match the appId, them update the object with the reponse data responseTime
            const appReportMetrics = appReportMetricsArray.find(app => app.appId === item.appId);
            if (appReportMetrics) {
                appReportMetrics.failedRequests = item.failedRequests;
            }
        });
        console.log('App Report Metrics Array:', appReportMetricsArray);

    } catch (error) {
        console.error('Error calling API:', error.response?.data || error.message);
    }
}


// create a function to call the CPU utilization endpoint
// https://anypoint.mulesoft.com/monitoring/api/organizations/{{organization_id}}/environments/{{environment_id}}/reports/cpu-utilization/from/now-1d/to/now
async function callCpuUtilizationEndpoint() {
    if (!accessToken) {
        await getAccessToken();
    }

    const endpointPath = `/monitoring/api/organizations/${config.organizationId}/environments/${config.environmentId}/reports/cpu-utilization/${config.api_query_time_duration}`;

    try {
        const response = await axios.get(`${config.api_base_url}${endpointPath}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        console.log(response.data);

        response.data.applicationData.forEach(item => {
            // For the response data, loop though the appReportMetricsArray and match the appId, them update the object with the reponse data responseTime
            const appReportMetrics = appReportMetricsArray.find(app => app.appId === item.appId);
            if (appReportMetrics) {
                appReportMetrics.cpuUtilization = parseFloat(item.cpuUtilization).toFixed(2);

            }
        });
        console.log('App Report Metrics Array:', appReportMetricsArray);

        // console.log('API response:', response.data);

    } catch (error) {
        console.error('Error calling API:', error.response?.data || error.message);
    }
}
// create a function to call the memory utilization endpoint
// https://anypoint.mulesoft.com/monitoring/api/organizations/{{organization_id}}/environments/{{environment_id}}/reports/memory-utilization/from/now-1d/to/now
async function callMemoryUtilizationEndpoint() {
    if (!accessToken) {
        await getAccessToken();
    }

    const endpointPath = `/monitoring/api/organizations/${config.organizationId}/environments/${config.environmentId}/reports/memory-utilization/${config.api_query_time_duration}`;

    try {
        const response = await axios.get(`${config.api_base_url}${endpointPath}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        console.log(response.data);

        response.data.applicationData.forEach(item => {
            // For the response data, loop though the appReportMetricsArray and match the appId, them update the object with the reponse data responseTime
            const appReportMetrics = appReportMetricsArray.find(app => app.appId === item.appId);
            if (appReportMetrics) {
                appReportMetrics.memoryPressure = parseFloat(item.memoryPressure).toFixed(2);
                appReportMetrics.memoryUtilization = (parseFloat(item.memoryUtilization) / (1024 * 1024)).toFixed(2);
                appReportMetrics.totalMemory = (parseFloat(item.totalMemory) / (1024 * 1024)).toFixed(2);

            }
        });
        console.log('App Report Metrics Array:', appReportMetricsArray);



    } catch (error) {
        console.error('Error calling API:', error.response?.data || error.message);
    }
}

// create a function to save the appReportMetricsArray to an Excel file
async function createExcelFile() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('App Report Metrics');
    worksheet.columns = [
        { header: 'Organization Name', key: 'orgName' },
        { header: 'Environment Name', key: 'envName' },
        { header: 'Application ID', key: 'appId' },
        { header: 'Request Volume', key: 'requestVolume' },
        { header: 'Successful Requests', key: 'successfulRequests' },
        { header: 'Failed Requests', key: 'failedRequests' },
        { header: 'Response Time', key: 'responseTime' },
        { header: 'CPU Utilization', key: 'cpuUtilization' },
        { header: 'Memory Pressure', key: 'memoryPressure' },
        { header: 'Memory Utilization', key: 'memoryUtilization' },
        { header: 'Total Memory', key: 'totalMemory' }
    ];
    appReportMetricsArray.forEach(item => {
        worksheet.addRow(item);
    });
    await workbook.xlsx.writeFile('appReportMetrics.xlsx');
    console.log('Excel file created successfully.');
}

// create a function to send appReportMetricsArray formatted in the body of the email
async function sendEmailWithMetrics() {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false, // true for 465, false for other ports
    });

    // Generate the HTML table
    const tableHeaders = `
        <tr>
            <th>Organization Name</th>
            <th>Environment Name</th>
            <th>Application ID</th>
            <th>Request Volume</th>
            <th>Successful Requests</th>
            <th>Failed Requests</th>
            <th>Request Success Rate</th>
            <th>Response Time (ms)</th>
            <th>CPU Utilization (%)</th>
            <th>Memory Pressure (%)</th>
            <th>Memory Utilization (MB)</th>
            <th>Total Memory (MB)</th>
        </tr>
    `;

    const tableRows = appReportMetricsArray.map(item => `
        <tr>
            <td>${item.orgName}</td>
            <td>${item.envName}</td>
            <td>${item.appId}</td>
            <td>${item.requestVolume}</td>
            <td>${item.successfulRequests}</td>
            <td>${item.failedRequests}</td>
            <td>${item.getSuccessRate()}</td>
            <td>${item.responseTime}</td>
            <td>${item.cpuUtilization}</td>
            <td>${item.memoryPressure}</td>
            <td>${item.memoryUtilization}</td>
            <td>${item.totalMemory}</td>
        </tr>
    `).join('');

    const htmlTable = `
        <table border="1" style="border-collapse: collapse; width: 100%;">
            ${tableHeaders}
            ${tableRows}
        </table>
    `;

    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO,
        subject: `Anypoint Application Report Metrics - ${config.environment}`,
        html: `
        <h1>Anypoint Application Report Metrics - ${config.environment} - ${config.api_query_time_duration}</h1>
        <p>Report generated on: ${new Date().toLocaleString()}</p>
        <p>This report provides detailed metrics for the specified environment and time duration.</p>
        ${htmlTable}
    `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error sending email:', error);
        }
        console.log('Email sent:', info.response);
    });
}

// Main function to call all endpoints and send the email
(async () => {
    await callRequestVolumeEndpoint();
    await callPerformanceEndpoint();
    await callFailuresEndpoint();
    await callCpuUtilizationEndpoint();
    await callMemoryUtilizationEndpoint();
    await sendEmailWithMetrics();
})();



class AppReportMetrics {
    constructor(
        orgName, // string: Organization name
        envName, // string: Environment name
        appId, // string: Application ID
        requestVolume, // number: Total number of requests
        successfulRequests, // number: Number of successful requests
        failedRequests, // number: Number of failed requests
        responseTime, // number: Average response time in milliseconds
        cpuUtilization, // number: CPU utilization percentage
        memoryPressure, // number: Memory pressure percentage
        memoryUtilization, // number: Memory utilization in bytes
        totalMemory // number: Total memory in bytes
    ) {
        this.orgName = orgName;
        this.envName = envName;
        this.appId = appId;
        this.requestVolume = requestVolume;
        this.successfulRequests = successfulRequests;
        this.failedRequests = failedRequests;
        this.responseTime = responseTime;
        this.cpuUtilization = cpuUtilization;
        this.memoryPressure = memoryPressure;
        this.memoryUtilization = memoryUtilization;
        this.totalMemory = totalMemory;
    }

    // Method to calculate the success rate
    getSuccessRate() {
        return this.requestVolume > 0
            ? ((this.successfulRequests / this.requestVolume) * 100).toFixed(2) + '%'
            : '0%';
    }

    // Method to display metrics as a formatted string
    displayMetrics() {
        return `
        Organization Name: ${this.orgName}
        Environment Name: ${this.envName}
        Application ID: ${this.appId}
        Request Volume: ${this.requestVolume}
        Successful Requests: ${this.successfulRequests}
        Failed Requests: ${this.failedRequests}
        Response Time: ${this.responseTime} ms
        CPU Utilization: ${this.cpuUtilization}%
        Memory Pressure: ${this.memoryPressure}%
        Memory Utilization: ${this.memoryUtilization} bytes
        Total Memory: ${this.totalMemory} bytes
        Success Rate: ${this.getSuccessRate()}
        `;
    }
}


