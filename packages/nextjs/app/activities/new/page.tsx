"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
// For fetching API launches
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useUserActivity } from "~~/contexts/UserActivityContext";
import { RocketLaunch, getNextLaunches } from "~~/services/launchApiService";
import { UserActivityStatus, UserActivityType } from "~~/types/lunargistics";

// Import toast

const NewActivityPage: NextPage = () => {
  const router = useRouter();
  const { addActivity } = useUserActivity();

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<UserActivityType>(UserActivityType.ROCKET_LAUNCH);
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [status, setStatus] = useState<UserActivityStatus>(UserActivityStatus.PLANNED);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [launchDateTime, setLaunchDateTime] = useState("");
  const [launchSite, setLaunchSite] = useState("");
  const [destination, setDestination] = useState("");
  const [payloadDetails, setPayloadDetails] = useState("");
  const [externalApiLaunchId, setExternalApiLaunchId] = useState<string | undefined>(undefined);
  const [externalApiSource, setExternalApiSource] = useState<"general" | "spacex" | undefined>(undefined);

  // State for API launch search
  const [apiLaunches, setApiLaunches] = useState<RocketLaunch[]>([]);
  const [isLoadingApiLaunches, setIsLoadingApiLaunches] = useState(false);
  const [showApiLaunchSelector, setShowApiLaunchSelector] = useState(false);

  // Form validation errors state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (showApiLaunchSelector) {
      const fetchApiLaunches = async () => {
        setIsLoadingApiLaunches(true);
        const launches = await getNextLaunches(25).catch(() => {
          toast.error("Failed to load upcoming launches from API.");
          return [];
        });
        setApiLaunches(launches);
        setIsLoadingApiLaunches(false);
      };
      fetchApiLaunches();
    }
  }, [showApiLaunchSelector]);

  const handleSelectApiLaunch = (launch: RocketLaunch) => {
    setName(launch.name || "");
    // Try to infer type, default to ROCKET_LAUNCH
    if (
      launch.name.toLowerCase().includes("satellite") ||
      launch.mission_description?.toLowerCase().includes("satellite")
    ) {
      setType(UserActivityType.SATELLITE_DEPLOYMENT);
    } else {
      setType(UserActivityType.ROCKET_LAUNCH);
    }
    setDescription(launch.launch_description || launch.mission_description || "");
    setLaunchDateTime(launch.win_open ? launch.win_open.substring(0, 16) : launch.t0 ? launch.t0.substring(0, 16) : "");
    setLaunchSite(launch.pad?.name || "");
    setOrganization(launch.provider?.name || "");
    setExternalApiLaunchId(String(launch.id));
    setExternalApiSource("general");
    setShowApiLaunchSelector(false); // Close selector after selection
    toast.success(`Pre-filled form with ${launch.name}`);
    setFormErrors({}); // Clear errors after pre-filling
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = "Activity name is required.";
    if (!description.trim()) errors.description = "Description is required.";

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = "End date cannot be before start date.";
    }

    if (
      (type === UserActivityType.ROCKET_LAUNCH || type === UserActivityType.SATELLITE_DEPLOYMENT) &&
      launchDateTime &&
      startDate
    ) {
      if (new Date(launchDateTime) < new Date(startDate)) {
        errors.launchDateTime = "Launch date/time cannot be before activity start date.";
      }
    }
    // Add more validation rules here as needed

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    // addActivity is already async from context, but we made it void here locally
    // We can add await if the context function is async and we want to wait for it
    await addActivity({
      name,
      type,
      description,
      organization: organization || undefined,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      launchDateTime: launchDateTime || undefined,
      launchSite: launchSite || undefined,
      destination: destination || undefined,
      payloadDetails: payloadDetails || undefined,
      externalApiLaunchId,
      externalApiSource,
    });
    // Toast for success is now handled in the context after successful transaction
    // router.push will also be handled after successful confirmation typically
    // For now, router.push is optimistic here.
    router.push("/activities");
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm mb-6 text-primary hover:bg-primary/10">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8 text-center">Log New Space Activity</h1>

        {/* API Launch Selector Button/Section */}
        <div className="mb-6 p-4 bg-base-300/50 rounded-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary">Link to an Upcoming Launch?</h2>
            <button
              type="button"
              onClick={() => setShowApiLaunchSelector(!showApiLaunchSelector)}
              className="btn btn-sm btn-outline btn-accent"
            >
              {showApiLaunchSelector ? "Hide Launch List" : "Show Upcoming Launches"}
            </button>
          </div>
          {showApiLaunchSelector && (
            <div className="mt-4 p-2 border border-base-300 rounded-md max-h-60 overflow-y-auto">
              {isLoadingApiLaunches ? (
                <p className="text-center">Loading launches...</p>
              ) : apiLaunches.length > 0 ? (
                <ul className="space-y-2">
                  {apiLaunches.map(launch => (
                    <li
                      key={launch.id}
                      onClick={() => handleSelectApiLaunch(launch)}
                      className="p-2 hover:bg-primary/20 rounded cursor-pointer text-sm"
                    >
                      <strong>{launch.name}</strong> ({launch.provider.name}) -{" "}
                      {new Date(
                        launch.win_open || launch.t0 || parseInt(launch.sort_date, 10) * 1000,
                      ).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center">No upcoming launches found or failed to load.</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-base-200 p-6 sm:p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-base-content/80 mb-1">
              Activity Name*
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className={`input input-bordered w-full bg-base-100 ${formErrors.name ? "input-error" : ""}`}
            />
            {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-base-content/80 mb-1">
              Activity Type*
            </label>
            <select
              id="type"
              value={type}
              onChange={e => setType(e.target.value as UserActivityType)}
              required
              className="select select-bordered w-full bg-base-100"
            >
              {Object.values(UserActivityType).map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-base-content/80 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              className={`textarea textarea-bordered w-full bg-base-100 ${formErrors.description ? "textarea-error" : ""}`}
            ></textarea>
            {formErrors.description && <p className="text-xs text-error mt-1">{formErrors.description}</p>}
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-base-content/80 mb-1">
              Organization
            </label>
            <input
              type="text"
              id="organization"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              className="input input-bordered w-full bg-base-100"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-base-content/80 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as UserActivityStatus)}
              className="select select-bordered w-full bg-base-100"
            >
              {Object.values(UserActivityStatus).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-base-content/80 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`input input-bordered w-full bg-base-100 ${formErrors.startDate || formErrors.endDate ? "input-error" : ""}`}
              />
              {formErrors.startDate && <p className="text-xs text-error mt-1">{formErrors.startDate}</p>}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-base-content/80 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`input input-bordered w-full bg-base-100 ${formErrors.endDate ? "input-error" : ""}`}
              />
              {formErrors.endDate && <p className="text-xs text-error mt-1">{formErrors.endDate}</p>}
            </div>
          </div>

          {(type === UserActivityType.ROCKET_LAUNCH || type === UserActivityType.SATELLITE_DEPLOYMENT) && (
            <>
              <div>
                <label htmlFor="launchDateTime" className="block text-sm font-medium text-base-content/80 mb-1">
                  Launch Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="launchDateTime"
                  value={launchDateTime}
                  onChange={e => setLaunchDateTime(e.target.value)}
                  className={`input input-bordered w-full bg-base-100 ${formErrors.launchDateTime ? "input-error" : ""}`}
                />
                {formErrors.launchDateTime && <p className="text-xs text-error mt-1">{formErrors.launchDateTime}</p>}
              </div>
              <div>
                <label htmlFor="launchSite" className="block text-sm font-medium text-base-content/80 mb-1">
                  Launch Site
                </label>
                <input
                  type="text"
                  id="launchSite"
                  value={launchSite}
                  onChange={e => setLaunchSite(e.target.value)}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-base-content/80 mb-1">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="input input-bordered w-full bg-base-100"
            />
          </div>

          <div>
            <label htmlFor="payloadDetails" className="block text-sm font-medium text-base-content/80 mb-1">
              Payload Details
            </label>
            <textarea
              id="payloadDetails"
              value={payloadDetails}
              onChange={e => setPayloadDetails(e.target.value)}
              rows={3}
              className="textarea textarea-bordered w-full bg-base-100"
            ></textarea>
          </div>

          {externalApiLaunchId && (
            <p className="text-xs text-success">
              Linked to API Launch ID: {externalApiLaunchId} ({externalApiSource})
            </p>
          )}

          <div className="pt-4">
            <button type="submit" className="btn btn-primary w-full sm:w-auto hover:bg-primary-focus transition-colors">
              Log Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewActivityPage;
