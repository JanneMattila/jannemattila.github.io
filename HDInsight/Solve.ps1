$startTime = Get-Date

Function Log ($message) {
	$currentTime = Get-Date
	$currentDelta = ($currentTime - $startTime).ToString("hh\:mm\:ss")
	Write-Output "${currentDelta}:  $message"
}

# Variables for setting up the Azure:
$subscriptionName = "Visual Studio Professional with MSDN"
$certificate = "F4A4B455F4A4B455F4A4B455F4A4B455F4A4B455"
$storageAccountName = "mypocketsolitaire"
$storageAccountUrl = "$storageAccountName.blob.core.windows.net"
$containerName = "mypocketsolitaire"
$location = "North Europe"
$clusterName = "mypocketsolitaire"
$clusterSizeInNodes = 1 # 1, 2, 4 or 8
$username = "admin"
$password = "Passw0Rd123!56" # Be creative ;-)

# Variables defining the streaming job:
$streamingJobName = "MyPocketSolitaire"
$mapper = "SolverMapper.exe"
$reducer = "SolverReducer.exe"
$mapperPath = "apps/SolverMapper.exe"
$reducerPath = "apps/SolverReducer.exe"
$containerUrl = "wasb://$containerName@$storageAccountUrl"
$mapperUrl = "$containerUrl/apps/SolverMapper.exe"
$reducerUrl = "$containerUrl/apps/SolverReducer.exe"
$initPath = "Input1"
$statusFolder = "/StatusOutput"
$initFile = "SolverInit.txt"
$resultFile = "Input32/part-00000"
$files = ($mapperUrl, $reducerUrl)

# You can also pass parameters to the streaming process if you wish.
# Here's example:
#$defines = @{ "mapreduce.job.maps"="100"; "mapreduce.job.reduces"="10" }
#$defines = @{ "mapreduce.job.maps"="1"; "mapreduce.job.reduces"="1" }
$defines = @{ }

Log("Setting up:")
Log(" - Initializing subscription settings")

Import-AzurePublishSettingsFile Subscription.publishsettings
$managementCertificate = Get-Item cert:\\CurrentUser\My\$certificate
Set-AzureSubscription `
	-SubscriptionName $subscriptionName `
	-Certificate $managementCertificate
Select-AzureSubscription `
	-SubscriptionName $subscriptionName


Log(" - Creating a storage account")
New-AzureStorageAccount `
	-StorageAccountName $storageAccountName `
	-location $location

Log(" - Creating blob container")
$storageAccountKey = (Get-AzureStorageKey $storageAccountName).Primary
$storageContext = New-AzureStorageContext  `
	–StorageAccountName $storageAccountName  `
	–StorageAccountKey $storageAccountKey
New-AzureStorageContainer `
	-Name $containerName `
	-Context $storageContext

Log(" - Uploading our files to blob container")
Set-AzureStorageBlobContent `
	-File $mapper -Container $containerName `
	-Blob $mapperPath -Context $storageContext
Set-AzureStorageBlobContent `
	-File $reducer -Container $containerName `
	-Blob $reducerPath -Context $storageContext
Set-AzureStorageBlobContent `
	-File $initFile -Container $containerName `
	-Blob $initPath -Context $storageContext


Log(" - Preparing configuration for HDInsight cluster")
$config = `
	New-AzureHDInsightClusterConfig `
		-ClusterSizeInNodes $clusterSizeInNodes |
	Set-AzureHDInsightDefaultStorage `
		-StorageAccountName $storageAccountUrl `
		-StorageAccountKey $storageAccountKey `
		-StorageContainerName $containerName

$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object PSCredential ($username, $securePassword)

Log(" - Creating HDInsight Cluster")
New-AzureHDInsightCluster `
	-Name $clusterName `
	-Location $location `
	-Config $config `
	-Credential $credential
Log("HDInsight Cluster Ready!")

Log("Starting our solving process:")
for ($inputLevel = 1; $inputLevel -lt 32; $inputLevel++) {
	Log(" - Processing level $inputLevel/32")
	$outputLevel = $inputLevel + 1
	$inputPath = $containerUrl + "/Input" + $inputLevel
	$outputPath = $containerUrl + "/Input" + $outputLevel
	$statusFolder = $containerUrl + "/StatusOutput"

	$jobDefinition = `
		New-AzureHDInsightStreamingMapReduceJobDefinition `
			-JobName $streamingJobName `
			-StatusFolder $statusFolder `
			-Mapper $mapper `
			-Combiner $reducer `
			-Reducer $reducer `
			-InputPath $inputPath `
			-OutputPath $outputPath `
			-Files $files `
			-Defines $defines
	
	$job = Start-AzureHDInsightJob `
		-Cluster $clusterName `
		-JobDefinition $jobDefinition

	Wait-AzureHDInsightJob -job $job -WaitTimeoutInSeconds 18000
}

Log("We're done with the solving!")

Log("Downloading result output")
Get-AzureStorageBlobContent `
	-Container $ContainerName `
	-Blob $resultFile `
	-Context $storageContext `
	-Force

Log("Now let's get rid of the used resources:")
Log(" - Getting rid of cluster")
Remove-AzureHDInsightCluster -Name $clusterName 

Log(" - Getting rid of storage")
Remove-AzureStorageAccount -StorageAccountName $storageAccountName

Log("Here's the content of the result file:")
Get-Content "./$resultFile"

Log("I hope you enjoyed the ride :D")